import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { AppError, recipientBinding, validateReport } from './domain.ts';
import type { Actor, Report, ReportInput } from './domain.ts';
import { initializeWorkflow, invalidateSharing, snapshotReport } from './workflow-schema.ts';

export const demoActors: Actor[] = [
  { id: 'contributor-a', name: 'Contributor A (fictional)', role: 'contributor', institutionId: null },
  { id: 'contributor-b', name: 'Contributor B (fictional)', role: 'contributor', institutionId: null },
  { id: 'moderator', name: 'Moderator (demonstration)', role: 'moderator', institutionId: null },
  { id: 'institution-bank', name: 'Example Bank representative (simulated)', role: 'institution', institutionId: 'demo-bank' },
  { id: 'institution-mobile', name: 'Example Mobile representative (simulated)', role: 'institution', institutionId: 'demo-mobile' },
];
const digest = (text: string) => createHash('sha256').update(text).digest('hex');
export const dataDirectory = () => resolve(process.env.DEMO_DATA_DIR || resolve(process.cwd(), '.demo'));
export class Store {
  db: DatabaseSync;
  constructor(path = resolve(dataDirectory(), 'reports.sqlite')) {
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS actors (id TEXT PRIMARY KEY, name TEXT NOT NULL, role TEXT NOT NULL,
        institutionId TEXT, salt TEXT NOT NULL, passwordHash TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS sessions (hash TEXT PRIMARY KEY, actorId TEXT NOT NULL REFERENCES actors(id), expires INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS login_attempts (at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS reports (id TEXT PRIMARY KEY, ownerId TEXT NOT NULL REFERENCES actors(id),
        version INTEGER NOT NULL, data TEXT NOT NULL, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS associations (reportId TEXT NOT NULL REFERENCES reports(id), institutionId TEXT NOT NULL,
        relationship TEXT NOT NULL, allowSharing INTEGER NOT NULL CHECK(allowSharing IN (0,1)),
        PRIMARY KEY(reportId,institutionId,relationship));
      CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, reportId TEXT NOT NULL REFERENCES reports(id),
        actorId TEXT NOT NULL REFERENCES actors(id), kind TEXT NOT NULL, version INTEGER NOT NULL, at TEXT NOT NULL);
      `);
    initializeWorkflow(this.db);
  }
  close() { this.db.close(); }
  transaction<T>(fn: () => T): T {
    this.db.exec('BEGIN IMMEDIATE');
    try { const result = fn(); this.db.exec('COMMIT'); return result; }
    catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  seedAccounts(beforeCommit?: (accounts: { actor: Actor; key: string }[]) => void): { actor: Actor; key: string }[] {
    return this.transaction(() => {
      if (this.db.prepare('SELECT id FROM actors LIMIT 1').get()) throw new AppError(409, 'Accounts already exist. Setup will not overwrite keys or reports.');
      const accounts = demoActors.map(actor => {
        const key = randomBytes(24).toString('base64url');
        const salt = randomBytes(16).toString('hex');
        const hash = scryptSync(key, salt, 32).toString('hex');
        this.db.prepare('INSERT INTO actors VALUES (?,?,?,?,?,?)').run(actor.id, actor.name, actor.role, actor.institutionId, salt, hash);
        return { actor, key };
      });
      beforeCommit?.(accounts);
      return accounts;
    });
  }
  signIn(id: string, key: string): string {
    const now = Date.now();
    this.db.prepare('DELETE FROM login_attempts WHERE at < ?').run(now - 60_000);
    const count = this.db.prepare('SELECT count(*) AS n FROM login_attempts').get()!.n as number;
    if (count >= 10) throw new AppError(429, 'Too many sign-in attempts. Wait one minute and retry.');
    this.db.prepare('INSERT INTO login_attempts VALUES (?)').run(now);
    const row = this.db.prepare('SELECT * FROM actors WHERE id = ?').get(id);
    const candidate = scryptSync(key, String(row?.salt ?? 'invalid-account-salt'), 32);
    const expected = Buffer.from(String(row?.passwordHash ?? '0'.repeat(64)), 'hex');
    if (!timingSafeEqual(candidate, expected) || !row) throw new AppError(401, 'Account or demo key is incorrect.');
    const token = randomBytes(32).toString('base64url');
    this.db.prepare('DELETE FROM sessions WHERE expires <= ?').run(now);
    this.db.prepare('INSERT INTO sessions VALUES (?,?,?)').run(digest(token), id, now + 8 * 3600_000);
    return token;
  }
  actor(token: string | undefined): Actor {
    if (!token || !/^[\w-]{43}$/.test(token)) throw new AppError(401, 'Sign in to open your private workspace.');
    const row = this.db.prepare(`SELECT a.id, a.name, a.role, a.institutionId FROM actors a JOIN sessions s ON s.actorId=a.id
      WHERE s.hash=? AND s.expires>?`).get(digest(token), Date.now());
    if (!row) throw new AppError(401, 'Your session ended. Sign in again.');
    return row as Actor;
  }
  signOut(token: string) { this.db.prepare('DELETE FROM sessions WHERE hash=?').run(digest(token)); }
  private requireContributor(actor: Actor) {
    if (actor.role !== 'contributor') throw new AppError(403, 'Only contributors may save or change their reports.');
  }
  private unpack(row: Record<string, unknown>): Report {
    const associations = this.db.prepare('SELECT institutionId, relationship, allowSharing FROM associations WHERE reportId=? ORDER BY rowid').all(String(row.id))
      .map(a => ({ institutionId: String(a.institutionId), relationship: String(a.relationship), allowInstitutionSharing: Boolean(a.allowSharing) }));
    const data = JSON.parse(String(row.data));
    // Legacy records remain byte-for-byte unchanged. Earlier sharing intent is
    // not equivalent to explicit approval of an exact community version.
    const approval = data.allowCommunitySharing && data.communityApproval?.sourceDigest === digest(data.narrative) &&
      data.communityApproval?.textDigest === digest(data.communityText) ? data.communityApproval : null;
    return { ...data, communityApproval: approval,
      communityApprovedAt: approval ? data.communityApprovedAt ?? null : null,
      communityApprovalVersion: approval ? data.communityApprovalVersion ?? null : null,
      associations, id: row.id, ownerId: row.ownerId, version: row.version,
      status: 'private', createdAt: row.createdAt, updatedAt: row.updatedAt } as Report;
  }
  private approvalMetadata(input: ReportInput, version: number, now: string, previous?: Report) {
    if (input.institutionApproval && (input.institutionApproval.sourceDigest !== digest(input.narrative) ||
      input.institutionApproval.textDigest !== digest(input.institutionText ?? '') ||
      input.institutionApproval.recipientsDigest !== digest(recipientBinding(input.associations))))
      throw new AppError(400, 'Organisation text, original or recipients changed. Review and approve the organisation version again.');
    const approval = input.communityApproval;
    if (!approval) return { communityApprovedAt: null, communityApprovalVersion: null };
    if (approval.sourceDigest !== digest(input.narrative) || approval.textDigest !== digest(input.communityText))
      throw new AppError(400, 'Your experience or community version changed. Review and approve the community version again.');
    const unchanged = previous?.communityApproval?.sourceDigest === approval.sourceDigest &&
      previous?.communityApproval?.textDigest === approval.textDigest && previous.communityApprovedAt;
    return { communityApprovedAt: unchanged ? previous.communityApprovedAt : now,
      communityApprovalVersion: unchanged ? previous.communityApprovalVersion : version };
  }
  read(actor: Actor, id: string): Report {
    // One indistinguishable response for missing and unauthorised objects.
    if (actor.role === 'institution') throw new AppError(404, 'Report not found.');
    const row = actor.role === 'moderator'
      ? this.db.prepare('SELECT * FROM reports WHERE id=?').get(id)
      : this.db.prepare('SELECT * FROM reports WHERE id=? AND ownerId=?').get(id, actor.id);
    if (!row) throw new AppError(404, 'Report not found.');
    return this.unpack(row);
  }
  // Server-internal workflow use only. HTTP routes must use read(actor, id).
  getInternalReport(id: string): Report {
    const row = this.db.prepare('SELECT * FROM reports WHERE id=?').get(id);
    if (!row) throw new AppError(404, 'Report not found.');
    return this.unpack(row);
  }
  list(actor: Actor): Report[] {
    if (actor.role === 'institution') return [];
    const rows = actor.role === 'moderator'
      ? this.db.prepare('SELECT * FROM reports ORDER BY createdAt DESC').all()
      : this.db.prepare('SELECT * FROM reports WHERE ownerId=? ORDER BY createdAt DESC').all(actor.id);
    return rows.map(row => this.unpack(row));
  }
  private saveAssociations(id: string, input: ReportInput) {
    for (const a of input.associations) this.db.prepare('INSERT INTO associations VALUES (?,?,?,?)').run(id, a.institutionId, a.relationship, Number(a.allowInstitutionSharing));
  }
  create(actor: Actor, value: unknown): Report {
    this.requireContributor(actor);
    const input = validateReport(value);
    return this.transaction(() => {
      const id = randomUUID(), now = new Date().toISOString();
      const { associations: _associations, ...data } = input;
      const approval = this.approvalMetadata(input, 1, now);
      this.db.prepare('INSERT INTO reports VALUES (?,?,1,?,?,?)').run(id, actor.id, JSON.stringify({ ...data, ...approval }), now, now);
      this.saveAssociations(id, input);
      snapshotReport(this.db, id);
      this.db.prepare('INSERT INTO events VALUES (?,?,?,?,?,?)').run(randomUUID(), id, actor.id, 'private_report_saved', 1, now);
      return this.read(actor, id);
    });
  }
  update(actor: Actor, id: string, version: number, value: unknown): Report {
    this.requireContributor(actor);
    // Check ownership before validation to avoid leaking object state.
    this.read(actor, id);
    const input = validateReport(value);
    if (!Number.isSafeInteger(version) || version < 1) throw new AppError(400, 'A valid report version is required.');
    return this.transaction(() => {
      const previous = this.read(actor, id);
      if (this.db.prepare('SELECT reportId FROM withdrawals WHERE reportId=?').get(id)) throw new AppError(409, 'This report was withdrawn and is read-only. Start a new report if needed.');
      if (previous.version !== version) throw new AppError(409, 'This report changed in another tab. Reload it before saving again.');
      snapshotReport(this.db, id);
      const { associations: _associations, ...data } = input;
      const now = new Date().toISOString();
      const approval = this.approvalMetadata(input, version + 1, now, previous);
      const result = this.db.prepare('UPDATE reports SET data=?,version=version+1,updatedAt=? WHERE id=? AND ownerId=? AND version=?')
        .run(JSON.stringify({ ...data, ...approval }), now, id, actor.id, version);
      if (result.changes !== 1) throw new AppError(409, 'This report changed in another tab. Reload it before saving again.');
      this.db.prepare('DELETE FROM associations WHERE reportId=?').run(id);
      this.saveAssociations(id, input);
      invalidateSharing(this.db, id, 'Report corrected or sharing choices changed. Previously delivered copies are retained.');
      snapshotReport(this.db, id);
      this.db.prepare('INSERT INTO events VALUES (?,?,?,?,?,?)').run(randomUUID(), id, actor.id, 'private_report_updated', version + 1, now);
      return this.read(actor, id);
    });
  }
}
