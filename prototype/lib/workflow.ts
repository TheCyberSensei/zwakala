import { createHash, randomUUID } from 'node:crypto';
import { AppError, recipientBinding } from './domain.ts';
import type { Actor, Report } from './domain.ts';
import type { Store } from './store.ts';
import { invalidateSharing, snapshotReport } from './workflow-schema.ts';

const hash = (text: string) => createHash('sha256').update(text).digest('hex');
const now = () => new Date().toISOString();
const requireRole = (actor: Actor, role: Actor['role']) => { if (actor.role !== role) throw new AppError(403, 'This action is not available to your account.'); };
export function fields(value: Record<string, unknown>, allowed: string[]) {
  if (Object.keys(value).some(k => !allowed.includes(k))) throw new AppError(400, 'Unexpected action fields.');
}
function reason(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length < 5 || value.length > 2000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(value)) throw new AppError(400, 'Provide a reason or update of 5–2,000 characters.');
  return value;
}
function choice<T extends string>(value: unknown, values: readonly T[]): T {
  if (!values.includes(value as T)) throw new AppError(400, 'Choose a valid action.'); return value as T;
}
export function relatedSuggestion(a: Report, b: Report) {
  const days = Math.abs(Date.parse(a.incidentDate) - Date.parse(b.incidentDate)) / 86400000;
  const reasons: string[] = [];
  const sameChannel = a.channel === b.channel;
  const sameOrganisation = a.associations.some(x => b.associations.some(y => x.institutionId === y.institutionId && x.relationship === y.relationship));
  const sameAction = !!a.requestedAction && !['unsure', 'other'].includes(a.requestedAction) && a.requestedAction === b.requestedAction;
  const normalized = (text: string) => text.trim().replace(/\s+/gu, ' ').toLocaleLowerCase('en');
  const duplicate = normalized(a.narrative) === normalized(b.narrative) && days === 0 && sameChannel;
  if (duplicate) reasons.push('Same normalized original text, incident date and channel. This may be a copied account, not independent evidence.');
  if (sameChannel) reasons.push('Same reported incident channel.');
  if (sameOrganisation) reasons.push('Same organisation with the same stated relationship; relevance does not establish fault.');
  if (sameAction) reasons.push('Same contributor-selected requested action.');
  if (days <= 14) reasons.push('Reported incident dates are within 14 days.');
  if (!duplicate && !(sameOrganisation && days <= 14 && (sameChannel || sameAction))) return null;
  return { kind: duplicate ? 'possible_duplicate' : 'possibly_related', reasons,
    sameContributor: a.ownerId === b.ownerId, caveat: 'A suggestion is not corroboration or proof of a shared campaign.' };
}
export class Workflow {
  store: Store;
  constructor(store: Store) { this.store = store; }
  get db() { return this.store.db; }
  private report(id: string) { return this.store.getInternalReport(id); }
  private withdrawn(id: string) { return this.db.prepare('SELECT * FROM withdrawals WHERE reportId=?').get(id); }
  private submitted(r: Report) { return this.db.prepare('SELECT * FROM submissions WHERE reportId=? AND version=?').get(r.id, r.version); }
  private review(r: Report) { return this.db.prepare('SELECT m.*,a.name AS actorName FROM moderation m JOIN actors a ON a.id=m.actorId WHERE reportId=? AND version=? ORDER BY m.rowid DESC LIMIT 1').get(r.id, r.version); }
  private eligibleCommunity(r: Report) { return r.allowCommunitySharing && !!r.communityApprovedAt && !!r.communityApproval && r.communityApproval.sourceDigest === hash(r.narrative) && r.communityApproval.textDigest === hash(r.communityText); }
  private eligibleInstitution(r: Report) { const a = r.institutionApproval; return !!a && !!r.institutionText && r.associations.some(x => x.allowInstitutionSharing) && a.sourceDigest === hash(r.narrative) && a.textDigest === hash(r.institutionText) && a.recipientsDigest === hash(recipientBinding(r.associations)); }
  private approved(r: Report) { return !this.withdrawn(r.id) && !!this.submitted(r) && this.review(r)?.decision === 'approve'; }
  private checkVersion(r: Report, version: unknown) { if (!Number.isSafeInteger(version) || r.version !== version) throw new AppError(409, 'The report changed. Reload before acting on this version.'); }
  private owner(actor: Actor, id: string) { requireRole(actor, 'contributor'); return this.store.read(actor, id); }
  private ready(r: Report) {
    if (this.withdrawn(r.id)) throw new AppError(409, 'This report has been withdrawn.');
    if (!r.allowCommunitySharing && !r.associations.some(a => a.allowInstitutionSharing)) throw new AppError(400, 'Choose an audience and approve the information before submitting.');
    if (r.allowCommunitySharing && !this.eligibleCommunity(r)) throw new AppError(400, 'The contributor must approve the exact community version.');
    if (r.associations.some(a => a.allowInstitutionSharing) && !this.eligibleInstitution(r)) throw new AppError(400, 'The contributor must approve the organisation text and selected recipients.');
  }
  submit(actor: Actor, id: string, version: unknown) {
    return this.store.transaction(() => { const r = this.owner(actor, id); this.checkVersion(r, version); this.ready(r);
      this.db.prepare('INSERT OR IGNORE INTO submissions VALUES (?,?,?,?)').run(id, r.version, actor.id, now());
      return this.journey(actor, id);
    });
  }
  queue(actor: Actor) {
    requireRole(actor, 'moderator');
    return this.store.list(actor).filter(r => this.submitted(r) && !this.withdrawn(r.id)).map(report => ({ report, review: this.review(report) ?? null,
      communityReady: this.eligibleCommunity(report), institutionReady: this.eligibleInstitution(report) }));
  }
  moderate(actor: Actor, id: string, version: unknown, decisionValue: unknown, reasonValue: unknown) {
    requireRole(actor, 'moderator'); const decision = choice(decisionValue, ['approve', 'withhold', 'clarification'] as const); const explanation = reason(reasonValue);
    this.store.transaction(() => {
      const r = this.report(id); this.checkVersion(r, version);
      if (!this.submitted(r) || this.withdrawn(id)) throw new AppError(409, 'Only the current submitted version can be reviewed.');
      if (decision === 'approve') this.ready(r);
      const at = now(); this.db.prepare('INSERT INTO moderation VALUES (?,?,?,?,?,?,?)').run(randomUUID(), id, r.version, decision, explanation, actor.id, at);
      if (decision !== 'approve') { invalidateSharing(this.db, id, 'Moderator ' + decision + ': further sharing stopped. Previously delivered copies are retained.'); return; }
      if (this.eligibleCommunity(r)) this.db.prepare('INSERT INTO releases VALUES (?,?,?,?,?,?,1) ON CONFLICT(reportId,version) DO UPDATE SET active=1,actorId=excluded.actorId,at=excluded.at')
        .run(randomUUID(), id, r.version, r.communityText, actor.id, at);
      if (this.eligibleInstitution(r)) for (const institutionId of new Set(r.associations.filter(a => a.allowInstitutionSharing).map(a => a.institutionId))) {
        const payload = JSON.stringify({ text: r.institutionText, relationships: r.associations.filter(a => a.institutionId === institutionId && a.allowInstitutionSharing).map(a => a.relationship),
          caveat: 'Fictional, unverified contributor account. Relevance is not responsibility, breach or wrongdoing.' });
        this.db.prepare(`INSERT INTO notifications VALUES (?,?,?,?,?,'pending',?,NULL,NULL) ON CONFLICT(reportId,version,institutionId)
          DO UPDATE SET status=CASE WHEN notifications.status='cancelled' THEN 'pending' ELSE notifications.status END,staleReason=NULL`)
          .run(randomUUID(), id, r.version, institutionId, payload, at);
      }
    });
    // Separate transaction: a delivery failure leaves a durable pending item.
    // No external transport is called. A moderator can retry pending items.
    let deliveryPending = false;
    try { this.deliverPending(actor); } catch { deliveryPending = true; }
    return { journey: this.journey(actor, id), deliveryPending };
  }
  deliverPending(actor: Actor) {
    requireRole(actor, 'moderator');
    return this.store.transaction(() => {
      let delivered = 0, cancelled = 0;
      for (const n of this.db.prepare("SELECT * FROM notifications WHERE status='pending'").all()) {
        const r = this.report(String(n.reportId));
        const current = r.version === n.version && this.approved(r) && this.eligibleInstitution(r) && r.associations.some(a => a.institutionId === n.institutionId && a.allowInstitutionSharing);
        const payload = JSON.parse(String(n.payload));
        const roles = r.associations.filter(a => a.institutionId === n.institutionId && a.allowInstitutionSharing).map(a => a.relationship);
        if (!current || payload.text !== r.institutionText || JSON.stringify(payload.relationships) !== JSON.stringify(roles)) {
          this.db.prepare("UPDATE notifications SET status='cancelled',staleReason=? WHERE id=?").run('Version, review or permission no longer current.', String(n.id)); cancelled++; continue;
        }
        this.db.prepare("UPDATE notifications SET status='delivered',deliveredAt=?,staleReason=NULL WHERE id=? AND status='pending'").run(now(), String(n.id)); delivered++;
      }
      return { delivered, cancelled };
    });
  }
  private visibleReleases() {
    return this.db.prepare('SELECT * FROM releases WHERE active=1 ORDER BY at DESC').all().filter(row => {
      const r = this.report(String(row.reportId)); return row.version === r.version && this.approved(r) && this.eligibleCommunity(r) && row.text === r.communityText;
    });
  }
  community() {
    const releases = this.visibleReleases();
    const experiences = releases.map(r => ({ id: String(r.id), text: String(r.text), label: 'Fictional, unverified contributor experience', reviewedAt: String(r.at) }));
    const notices = this.db.prepare('SELECT * FROM notices ORDER BY at DESC').all().flatMap(n => {
      const link = this.db.prepare('SELECT * FROM report_links WHERE id=?').get(String(n.linkId)); if (!link || link.decision !== 'related') return [];
      const latest = this.db.prepare('SELECT id FROM report_links WHERE leftId=? AND rightId=? ORDER BY rowid DESC LIMIT 1').get(String(link.leftId), String(link.rightId));
      if (latest?.id !== link.id) return [];
      const left = releases.find(r => r.reportId === link.leftId && r.version === link.leftVersion);
      const right = releases.find(r => r.reportId === link.rightId && r.version === link.rightVersion);
      if (!left || !right || this.report(String(link.leftId)).ownerId === this.report(String(link.rightId)).ownerId) return [];
      return [{ id: String(n.id), experienceIds: [String(left.id), String(right.id)], reviewedAt: String(n.at),
        text: 'A moderator marked these two fictional experiences as potentially related. Similarity does not verify the allegations, establish independent corroboration or prove a shared scam campaign. No institutional fault or breach is established.' }];
    });
    return { experiences, notices, simulation: 'Local fictional community view. No public deployment.' };
  }
  suggestions(actor: Actor) {
    requireRole(actor, 'moderator');
    const reports = this.queue(actor).map(x => x.report).sort((a, b) => a.id.localeCompare(b.id, 'en'));
    const result = [];
    for (let i = 0; i < reports.length; i++) for (let j = i + 1; j < reports.length; j++) {
      const a = reports[i], b = reports[j]; const suggestion = relatedSuggestion(a, b); if (!suggestion) continue;
      const decision = this.db.prepare('SELECT l.*,a.name AS actorName FROM report_links l JOIN actors a ON a.id=l.actorId WHERE leftId=? AND leftVersion=? AND rightId=? AND rightVersion=? ORDER BY l.rowid DESC LIMIT 1').get(a.id, a.version, b.id, b.version);
      result.push({ leftId: a.id, leftVersion: a.version, leftTitle: a.title, rightId: b.id, rightVersion: b.version, rightTitle: b.title, ...suggestion, decision: decision ?? null });
    }
    return result;
  }
  decideLink(actor: Actor, body: Record<string, unknown>) {
    requireRole(actor, 'moderator'); fields(body, ['leftId', 'rightId', 'leftVersion', 'rightVersion', 'decision', 'reason']);
    const decision = choice(body.decision, ['related', 'duplicate', 'rejected'] as const), explanation = reason(body.reason);
    return this.store.transaction(() => {
      const suggestion = this.suggestions(actor).find(s => s.leftId === body.leftId && s.rightId === body.rightId && s.leftVersion === body.leftVersion && s.rightVersion === body.rightVersion);
      if (!suggestion) throw new AppError(409, 'This suggestion is no longer current. Reload the queue.');
      const id = randomUUID(); this.db.prepare('INSERT INTO report_links VALUES (?,?,?,?,?,?,?,?,?)').run(id, suggestion.leftId, suggestion.leftVersion, suggestion.rightId, suggestion.rightVersion, decision, explanation, actor.id, now());
      return { id, decision };
    });
  }
  publishNotice(actor: Actor, linkId: string, reasonValue: unknown) {
    requireRole(actor, 'moderator'); const explanation = reason(reasonValue);
    return this.store.transaction(() => {
      const link = this.db.prepare('SELECT * FROM report_links WHERE id=?').get(linkId);
      if (!link || link.decision !== 'related') throw new AppError(409, 'Confirm a potentially related pair first. Duplicate/rejected pairs cannot create notices.');
      const releases = this.visibleReleases();
      const latest = this.db.prepare('SELECT id FROM report_links WHERE leftId=? AND rightId=? ORDER BY rowid DESC LIMIT 1').get(String(link.leftId), String(link.rightId));
      if (latest?.id !== link.id || !releases.some(r => r.reportId === link.leftId && r.version === link.leftVersion) || !releases.some(r => r.reportId === link.rightId && r.version === link.rightVersion) || this.report(String(link.leftId)).ownerId === this.report(String(link.rightId)).ownerId)
        throw new AppError(409, 'Both current experiences must be approved for community display and come from different demo contributors.');
      this.db.prepare('INSERT OR IGNORE INTO notices VALUES (?,?,?,?,?)').run(randomUUID(), linkId, actor.id, explanation, now());
      return { displayed: true };
    });
  }
  private updates(notificationId: string) {
    return this.db.prepare('SELECT u.id,u.kind,u.message,u.at,a.name AS actorName FROM institution_updates u JOIN actors a ON a.id=u.actorId WHERE notificationId=? ORDER BY u.rowid').all(notificationId)
      .map(u => ({ ...u, feedback: this.db.prepare('SELECT f.decision,f.reason,f.at,a.name AS actorName FROM contributor_feedback f JOIN actors a ON a.id=f.actorId WHERE updateId=? ORDER BY f.rowid').all(String(u.id)) }));
  }
  inbox(actor: Actor) {
    requireRole(actor, 'institution');
    return this.db.prepare("SELECT * FROM notifications WHERE institutionId=? AND status='delivered' ORDER BY deliveredAt DESC").all(actor.institutionId!)
      .map(n => ({ id: String(n.id), version: Number(n.version), institutionId: String(n.institutionId), ...JSON.parse(String(n.payload)), deliveredAt: String(n.deliveredAt), staleReason: n.staleReason, updates: this.updates(String(n.id)), simulated: true }));
  }
  respond(actor: Actor, notificationId: string, kindValue: unknown, messageValue: unknown) {
    requireRole(actor, 'institution'); const kind = choice(kindValue, ['acknowledged', 'investigating', 'action_reported', 'resolution_reported'] as const), message = reason(messageValue);
    return this.store.transaction(() => {
      const n = this.db.prepare("SELECT * FROM notifications WHERE id=? AND institutionId=? AND status='delivered'").get(notificationId, actor.institutionId!);
      if (!n) throw new AppError(404, 'Notification not found.');
      if (n.staleReason || !this.approved(this.report(String(n.reportId))) || this.report(String(n.reportId)).version !== n.version) throw new AppError(409, 'This delivered version is no longer current. Its history is retained; no new response may be added.');
      const updates = this.updates(notificationId);
      if ((!updates.length && kind !== 'acknowledged') || (updates.length && kind === 'acknowledged')) throw new AppError(409, 'Acknowledge once before adding investigation or outcome updates.');
      if (kind === 'resolution_reported' && !this.db.prepare("SELECT id FROM institution_updates WHERE notificationId=? AND kind='action_reported'").get(notificationId)) throw new AppError(409, 'Describe the reported action before reporting resolution.');
      const id = randomUUID(); this.db.prepare('INSERT INTO institution_updates VALUES (?,?,?,?,?,?)').run(id, notificationId, actor.id, kind, message, now());
      return { id, kind };
    });
  }
  feedback(actor: Actor, updateId: string, decisionValue: unknown, reasonValue: unknown) {
    requireRole(actor, 'contributor'); const decision = choice(decisionValue, ['confirmed', 'disputed'] as const), explanation = reason(reasonValue);
    return this.store.transaction(() => {
      const row = this.db.prepare('SELECT u.*,r.ownerId FROM institution_updates u JOIN notifications n ON n.id=u.notificationId JOIN reports r ON r.id=n.reportId WHERE u.id=? AND r.ownerId=?').get(updateId, actor.id);
      if (!row) throw new AppError(404, 'Update not found.');
      if (!['action_reported', 'resolution_reported'].includes(String(row.kind))) throw new AppError(400, 'Confirm or dispute a reported outcome, not delivery or acknowledgement.');
      const id = randomUUID(); this.db.prepare('INSERT INTO contributor_feedback VALUES (?,?,?,?,?,?)').run(id, updateId, actor.id, decision, explanation, now());
      return { id, decision };
    });
  }
  journey(actor: Actor, id: string) {
    const r = this.store.read(actor, id);
    const moderation = this.db.prepare('SELECT m.version,m.decision,m.reason,m.at,a.name AS actorName FROM moderation m JOIN actors a ON a.id=m.actorId WHERE reportId=? ORDER BY m.rowid').all(id);
    const notifications = this.db.prepare('SELECT * FROM notifications WHERE reportId=? ORDER BY rowid').all(id).map(n => ({ id: String(n.id), version: Number(n.version), institutionId: String(n.institutionId), status: String(n.status), createdAt: String(n.createdAt), deliveredAt: n.deliveredAt, staleReason: n.staleReason, updates: this.updates(String(n.id)) }));
    const changes = this.db.prepare('SELECT e.version,e.kind,e.at,a.name AS actorName FROM events e JOIN actors a ON a.id=e.actorId WHERE reportId=? ORDER BY e.rowid').all(id);
    return { version: r.version, submitted: this.submitted(r) ?? null, review: this.review(r) ?? null, withdrawal: this.withdrawn(id) ?? null,
      communityVisible: this.visibleReleases().some(x => x.reportId === id), moderation, notifications, changes,
      institutionReady: this.eligibleInstitution(r), communityReady: this.eligibleCommunity(r) };
  }
  withdraw(actor: Actor, id: string, version: unknown, reasonValue: unknown) {
    const explanation = reason(reasonValue);
    return this.store.transaction(() => {
      const r = this.owner(actor, id); this.checkVersion(r, version);
      if (this.withdrawn(id)) return this.journey(actor, id);
      snapshotReport(this.db, id);
      const row = this.db.prepare('SELECT data FROM reports WHERE id=?').get(id)!;
      const data = { ...JSON.parse(String(row.data)), allowCommunitySharing: false, communityApproval: null, communityApprovedAt: null, communityApprovalVersion: null, institutionApproval: null };
      const at = now(); this.db.prepare('UPDATE reports SET version=version+1,data=?,updatedAt=? WHERE id=?').run(JSON.stringify(data), at, id);
      this.db.prepare('UPDATE associations SET allowSharing=0 WHERE reportId=?').run(id);
      this.db.prepare('INSERT INTO withdrawals VALUES (?,?,?,?)').run(id, actor.id, explanation, at);
      invalidateSharing(this.db, id, 'Contributor withdrew the report. Previously delivered copies are retained, not recalled.');
      snapshotReport(this.db, id);
      this.db.prepare('INSERT INTO events VALUES (?,?,?,?,?,?)').run(randomUUID(), id, actor.id, 'report_withdrawn', r.version + 1, at);
      return this.journey(actor, id);
    });
  }
}
