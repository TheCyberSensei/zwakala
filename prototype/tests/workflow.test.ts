import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../lib/store.ts';
import { Workflow, relatedSuggestion } from '../lib/workflow.ts';
import { communityApprovalFor, institutionApprovalFor } from '../lib/domain.ts';
import type { Actor, ReportInput } from '../lib/domain.ts';
import { handle } from '../lib/http.ts';

function fixture(path = ':memory:') {
  const store = new Store(path), accounts = store.seedAccounts(), w = new Workflow(store);
  const actor = (id: string) => accounts.find(x => x.actor.id === id)!.actor;
  return { store, w, accounts, a: actor('contributor-a'), b: actor('contributor-b'), mod: actor('moderator'), bank: actor('institution-bank'), mobile: actor('institution-mobile') };
}
async function input(extra: Partial<ReportInput> = {}): Promise<ReportInput> {
  const r: ReportInput = { fictional: true, title: 'PRIVATE TITLE — fictional test', narrative: 'PRIVATE ORIGINAL — fictional message asked for a security code. Ngithole umyalezo.', incidentDate: '2026-11-01', channel: 'SMS', outcome: 'attempted', requestedAction: 'share_code', languages: ['English', 'isiZulu'], associations: [
    { institutionId: 'demo-bank', relationship: 'impersonated', allowInstitutionSharing: true },
    { institutionId: 'demo-bank', relationship: 'potential_responder', allowInstitutionSharing: true },
    { institutionId: 'demo-mobile', relationship: 'service_involved', allowInstitutionSharing: true },
  ], allowCommunitySharing: true, communityText: 'FICTIONAL community account: a message asked for a code.', communityApproval: null, institutionText: 'FICTIONAL approved organisation account: someone asked for a code.', institutionApproval: null, ...extra };
  if (r.allowCommunitySharing) r.communityApproval = await communityApprovalFor(r.narrative, r.communityText);
  if (r.associations.some(a => a.allowInstitutionSharing)) r.institutionApproval = await institutionApprovalFor(r.narrative, r.institutionText!, r.associations);
  return r;
}
async function submitted(f: ReturnType<typeof fixture>, actor = f.a, extra: Partial<ReportInput> = {}) {
  const r = f.store.create(actor, await input(extra)); f.w.submit(actor, r.id, r.version); return r;
}
const approve = (f: ReturnType<typeof fixture>, id: string, version = 1) => f.w.moderate(f.mod, id, version, 'approve', 'Fictional review: exact approved text checked.');
const denied = (fn: () => unknown, status: number) => assert.throws(fn, (e: unknown) => !!e && (e as { status: number }).status === status);
test('private saving is not submission; legacy recipient intent cannot be shared', async () => {
  const f = fixture(); try {
    const v = await input(); v.institutionApproval = null; const r = f.store.create(f.a, v);
    assert.equal(f.w.queue(f.mod).length, 0); assert.equal(f.w.community().experiences.length, 0);
    denied(() => f.w.submit(f.a, r.id, 1), 400); denied(() => approve(f, r.id), 409);
  } finally { f.store.close(); }
});
test('institution approval binds exact original, text and recipient relationships', async () => {
  const f = fixture(); try {
    const v = await input();
    for (const changed of [{ ...v, narrative: v.narrative + ' changed' }, { ...v, institutionText: v.institutionText + ' changed' }, { ...v, associations: v.associations.slice(1) }]) denied(() => f.store.create(f.a, changed), 400);
    assert.equal(f.store.list(f.a).length, 0);
  } finally { f.store.close(); }
});
test('withholding and clarification record actor/reason and do not release or deliver', async () => {
  const f = fixture(); try {
    const r = await submitted(f);
    for (const decision of ['withhold', 'clarification']) f.w.moderate(f.mod, r.id, 1, decision, 'Fictional reason: clarification is needed.');
    const j = f.w.journey(f.a, r.id); assert.equal(j.moderation.length, 2); assert.equal(j.moderation[0].actorName, f.mod.name); assert.equal(j.notifications.length, 0); assert.equal(j.communityVisible, false);
    denied(() => f.w.moderate(f.mod, r.id, 1, 'approve', ''), 400);
  } finally { f.store.close(); }
});
test('approved exact community text excludes original, title, recipients and internal identifiers', async () => {
  const f = fixture(); try {
    const r = await submitted(f); approve(f, r.id);
    const output = f.w.community(); assert.equal(output.experiences[0].text, r.communityText);
    const encoded = JSON.stringify(output); for (const secret of [r.id, r.ownerId, r.narrative, r.title, r.institutionText!, 'demo-bank']) assert(!encoded.includes(secret));
    assert(encoded.includes('unverified')); assert.equal(f.w.journey(f.a, r.id).communityVisible, true);
  } finally { f.store.close(); }
});
test('immediate persistent routing groups relationships per recipient and never duplicates delivery', async () => {
  const f = fixture(); try {
    const r = await submitted(f); approve(f, r.id); approve(f, r.id); f.w.deliverPending(f.mod);
    const bank = f.w.inbox(f.bank), mobile = f.w.inbox(f.mobile); assert.equal(bank.length, 1); assert.equal(mobile.length, 1);
    assert.deepEqual(bank[0].relationships, ['impersonated', 'potential_responder']); assert.deepEqual(mobile[0].relationships, ['service_involved']);
    assert.notEqual(bank[0].id, mobile[0].id); assert(!JSON.stringify(bank).includes(r.narrative)); assert(!JSON.stringify(bank).includes(r.id));
    assert.equal(f.w.journey(f.a, r.id).notifications.length, 2);
  } finally { f.store.close(); }
});
test('separate channel permissions route only approved audiences', async () => {
  const f = fixture(); try {
    const community = await submitted(f, f.a, { associations: [] }); approve(f, community.id);
    const institution = await submitted(f, f.b, { allowCommunitySharing: false, communityText: '', associations: [{ institutionId: 'demo-bank', relationship: 'impersonated', allowInstitutionSharing: true }, { institutionId: 'demo-mobile', relationship: 'service_involved', allowInstitutionSharing: false }] }); approve(f, institution.id);
    assert.equal(f.w.community().experiences.length, 1); assert.equal(f.w.inbox(f.bank).length, 1); assert.equal(f.w.inbox(f.mobile).length, 0);
  } finally { f.store.close(); }
});
test('failed delivery remains durably pending and retries deliver once', async () => {
  const f = fixture(); try {
    const r = await submitted(f); f.store.db.exec("CREATE TRIGGER fail_delivery BEFORE UPDATE OF status ON notifications WHEN NEW.status='delivered' BEGIN SELECT RAISE(ABORT,'simulated storage failure'); END;");
    assert.equal(approve(f, r.id).deliveryPending, true); assert(f.w.journey(f.a, r.id).notifications.every(n => n.status === 'pending')); assert.equal(f.w.inbox(f.bank).length, 0);
    f.store.db.exec('DROP TRIGGER fail_delivery'); assert.equal(f.w.deliverPending(f.mod).delivered, 2); assert.equal(f.w.deliverPending(f.mod).delivered, 0);
  } finally { f.store.close(); }
});
test('correction cancels pending queue, removes display and requires a new submission/review', async () => {
  const f = fixture(); try {
    const r = await submitted(f); f.store.db.exec("CREATE TRIGGER fail_delivery BEFORE UPDATE OF status ON notifications WHEN NEW.status='delivered' BEGIN SELECT RAISE(ABORT,'failure'); END;");
    approve(f, r.id); const v = await input({ narrative: 'FICTIONAL corrected account: the original sequence was wrong.' }); f.store.update(f.a, r.id, 1, v);
    f.store.db.exec('DROP TRIGGER fail_delivery'); assert.equal(f.w.deliverPending(f.mod).delivered, 0); assert.equal(f.w.community().experiences.length, 0); assert(f.w.journey(f.a, r.id).notifications.every(n => n.status === 'cancelled'));
    denied(() => approve(f, r.id, 1), 409); denied(() => approve(f, r.id, 2), 409);
    f.w.submit(f.a, r.id, 2); approve(f, r.id, 2); assert.equal(f.w.inbox(f.bank).length, 1);
    assert.equal(f.store.db.prepare('SELECT COUNT(*) AS n FROM report_revisions WHERE reportId=?').get(r.id)!.n, 2);
  } finally { f.store.close(); }
});
test('delivered snapshots remain historical after permission changes, without claiming recall', async () => {
  const f = fixture(); try {
    const r = await submitted(f); approve(f, r.id);
    f.store.update(f.a, r.id, 1, await input({ allowCommunitySharing: false, associations: [], institutionText: '', institutionApproval: null }));
    assert.equal(f.w.community().experiences.length, 0); const n = f.w.inbox(f.bank)[0]; assert(n.staleReason); assert.equal(n.text, r.institutionText);
    denied(() => f.w.respond(f.bank, n.id, 'acknowledged', 'Fictional acknowledgement.'), 409);
  } finally { f.store.close(); }
});
test('withdrawal stops visibility and future actions but preserves delivered history', async () => {
  const f = fixture(); try {
    const r = await submitted(f); approve(f, r.id); f.w.withdraw(f.a, r.id, 1, 'Fictional contributor withdraws permission.');
    assert.equal(f.w.community().experiences.length, 0); assert.equal(f.w.queue(f.mod).length, 0); assert(f.w.inbox(f.bank)[0].staleReason);
    const current = f.store.read(f.a, r.id); assert.equal(current.version, 2); assert(!current.allowCommunitySharing); assert(current.associations.every(a => !a.allowInstitutionSharing));
    const replacement = await input(); denied(() => f.store.update(f.a, r.id, 2, replacement), 409); denied(() => f.w.submit(f.a, r.id, 2), 409);
  } finally { f.store.close(); }
});
test('institutional stages are attributable; contributor confirms/disputes specific outcomes', async () => {
  const f = fixture(); try {
    const r = await submitted(f); approve(f, r.id); const n = f.w.inbox(f.bank)[0];
    denied(() => f.w.respond(f.bank, n.id, 'investigating', 'Fictional investigation.'), 409);
    const ack = f.w.respond(f.bank, n.id, 'acknowledged', 'Fictional receipt acknowledged.'); denied(() => f.w.respond(f.bank, n.id, 'acknowledged', 'Fictional repeat.'), 409);
    denied(() => f.w.feedback(f.a, ack.id, 'confirmed', 'Fictional confirmation.'), 400);
    f.w.respond(f.bank, n.id, 'investigating', 'Fictional investigation opened.'); denied(() => f.w.respond(f.bank, n.id, 'resolution_reported', 'Fictional resolution.'), 409);
    const action = f.w.respond(f.bank, n.id, 'action_reported', 'Fictional warning was prepared.'); f.w.feedback(f.a, action.id, 'disputed', 'Fictional contributor has not received help.');
    const resolution = f.w.respond(f.bank, n.id, 'resolution_reported', 'Fictional assistance was provided.'); f.w.feedback(f.a, resolution.id, 'confirmed', 'Fictional contributor confirms this later outcome.');
    const encoded = JSON.stringify(f.w.journey(f.a, r.id)); assert(encoded.includes('disputed')); assert(encoded.includes('confirmed')); assert(encoded.includes(f.bank.name)); assert(encoded.includes(f.a.name));
  } finally { f.store.close(); }
});
test('other institutions/contributors cannot read, respond or dispute another private journey', async () => {
  const f = fixture(); try {
    const r = await submitted(f); approve(f, r.id); const n = f.w.inbox(f.bank)[0];
    denied(() => f.w.respond(f.mobile, n.id, 'acknowledged', 'Fictional cross-tenant attempt.'), 404);
    denied(() => f.w.journey(f.bank, r.id), 404); denied(() => f.w.journey(f.b, r.id), 404);
    f.w.respond(f.bank, n.id, 'acknowledged', 'Fictional receipt.'); const u = f.w.respond(f.bank, n.id, 'action_reported', 'Fictional action reported.');
    denied(() => f.w.feedback(f.b, u.id, 'confirmed', 'Fictional foreign confirmation.'), 404);
    denied(() => f.w.inbox(f.mod), 403); denied(() => f.w.queue(f.bank), 403); denied(() => f.w.withdraw(f.b, r.id, 1, 'Fictional foreign withdrawal.'), 404);
  } finally { f.store.close(); }
});
test('matching explains related experiences, distinguishes duplicates and rejects weak coincidences', async () => {
  const f = fixture(); try {
    const a = await submitted(f), b = await submitted(f, f.b, { narrative: 'FICTIONAL different message also requested a code.' });
    assert.equal(relatedSuggestion(a, b)!.kind, 'possibly_related'); assert(relatedSuggestion(a, b)!.reasons.length >= 3);
    assert.equal(relatedSuggestion(a, { ...b, narrative: a.narrative })!.kind, 'possible_duplicate');
    assert.equal(relatedSuggestion(a, { ...b, incidentDate: '2025-01-01' }), null);
    assert.equal(relatedSuggestion(a, { ...b, associations: [] }), null);
    assert.equal(relatedSuggestion(a, { ...b, channel: 'Email', requestedAction: 'unsure' }), null);
  } finally { f.store.close(); }
});
test('association decisions and qualified notices are reviewed, version-bound and revocable', async () => {
  const f = fixture(); try {
    const a = await submitted(f), b = await submitted(f, f.b, { narrative: 'FICTIONAL another person describes a different code message.' }); approve(f, a.id); approve(f, b.id);
    const s = f.w.suggestions(f.mod)[0], body = { leftId: s.leftId, leftVersion: s.leftVersion, rightId: s.rightId, rightVersion: s.rightVersion, reason: 'Fictional review of relevant similarities.' };
    let l = f.w.decideLink(f.mod, { ...body, decision: 'rejected' }); denied(() => f.w.publishNotice(f.mod, l.id, 'Fictional notice reason.'), 409);
    l = f.w.decideLink(f.mod, { ...body, decision: 'duplicate' }); denied(() => f.w.publishNotice(f.mod, l.id, 'Fictional notice reason.'), 409);
    l = f.w.decideLink(f.mod, { ...body, decision: 'related' }); f.w.publishNotice(f.mod, l.id, 'Fictional reviewed qualification.');
    assert.equal(f.w.community().notices.length, 1); assert(f.w.community().notices[0].text.includes('does not verify'));
    f.w.decideLink(f.mod, { ...body, decision: 'rejected' }); assert.equal(f.w.community().notices.length, 0);
    l = f.w.decideLink(f.mod, { ...body, decision: 'related' }); f.w.publishNotice(f.mod, l.id, 'Fictional reviewed notice.');
    f.store.update(f.a, a.id, 1, await input({ title: 'Fictional corrected title' })); assert.equal(f.w.community().notices.length, 0);
    denied(() => f.w.decideLink(f.mod, { ...body, decision: 'related' }), 409);
  } finally { f.store.close(); }
});
test('one contributor cannot create a community pattern from their own multiple reports', async () => {
  const f = fixture(); try {
    const a = await submitted(f), b = await submitted(f); approve(f, a.id); approve(f, b.id);
    const s = f.w.suggestions(f.mod)[0]; assert(s.sameContributor);
    const l = f.w.decideLink(f.mod, { leftId: s.leftId, leftVersion: 1, rightId: s.rightId, rightVersion: 1, decision: 'related', reason: 'Fictional similarity review.' });
    denied(() => f.w.publishNotice(f.mod, l.id, 'Fictional notice attempt.'), 409);
  } finally { f.store.close(); }
});
test('moderation transaction failure rolls back decisions and release creation', async () => {
  const f = fixture(); try {
    const r = await submitted(f); f.store.db.exec("CREATE TRIGGER fail_notification BEFORE INSERT ON notifications BEGIN SELECT RAISE(ABORT,'failure'); END;");
    assert.throws(() => approve(f, r.id)); assert.equal(f.w.journey(f.a, r.id).moderation.length, 0); assert.equal(f.w.community().experiences.length, 0);
  } finally { f.store.close(); }
});
test('new workflow APIs enforce authentication, roles, versions, origin and strict action fields', async () => {
  const f = fixture(); try {
    const r = await submitted(f); approve(f, r.id); const n = f.w.inbox(f.bank)[0];
    const tokens = Object.fromEntries(f.accounts.map(x => [x.actor.id, f.store.signIn(x.actor.id, x.key)]));
    const call = async (path: string, actor?: Actor, method = 'GET', value?: unknown, origin = 'http://127.0.0.1:3000') => handle(new Request('http://127.0.0.1:3000/api/' + path, { method, headers: { ...(actor ? { Cookie: 'demo_session=' + tokens[actor.id] } : {}), Origin: origin, 'Content-Type': 'application/json' }, body: value === undefined ? undefined : JSON.stringify(value) }), f.store);
    for (const path of ['community', 'moderation', 'inbox', 'reports/' + r.id + '/journey']) assert.equal((await call(path)).status, 401);
    assert.equal((await call('moderation', f.a)).status, 403); assert.equal((await call('inbox', f.a)).status, 403);
    assert.equal((await call('reports/' + r.id + '/moderate', f.a, 'POST', { version: 1, decision: 'approve', reason: 'Fictional forged review.' })).status, 403);
    assert.equal((await call('reports/' + r.id + '/submit', f.a, 'POST', { version: 1, actorId: 'moderator' })).status, 400);
    assert.equal((await call('reports/' + r.id + '/withdraw', f.a, 'POST', { version: 1, reason: 'Fictional CSRF.' }, 'https://evil.invalid')).status, 403);
    assert.equal((await call('inbox/' + n.id + '/updates', f.mobile, 'POST', { kind: 'acknowledged', message: 'Fictional foreign update.' })).status, 404);
    assert.equal((await call('deliveries/retry', f.bank, 'POST', {})).status, 403);
    assert.equal((await call('links', f.a, 'POST', {})).status, 403); assert.equal((await call('notices', f.a, 'POST', { linkId: 'invalid', reason: 'Fictional notice.' })).status, 403);
    const community = await call('community', f.a); assert.equal(community.headers.get('cache-control'), 'private, no-store'); assert.equal(community.status, 200);
  } finally { f.store.close(); }
});
test('workflow persistence survives reopen without modifying existing report rows or credentials', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'digital-safety-workflow-')), path = join(dir, 'test.sqlite'); const f = fixture(path);
  try {
    const r = await submitted(f); approve(f, r.id); const before = JSON.stringify(f.store.db.prepare('SELECT * FROM reports').all()), actors = JSON.stringify(f.store.db.prepare('SELECT * FROM actors').all());
    f.store.close(); const reopened = new Store(path); try {
      assert.equal(JSON.stringify(reopened.db.prepare('SELECT * FROM reports').all()), before); assert.equal(JSON.stringify(reopened.db.prepare('SELECT * FROM actors').all()), actors);
      assert.equal(new Workflow(reopened).inbox(f.bank).length, 1); assert.equal(new Workflow(reopened).community().experiences.length, 1);
    } finally { reopened.close(); }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('withholding after approval stops display and responses while retaining attributable history', async () => {
  const f = fixture(); try {
    const r = await submitted(f); approve(f, r.id); const n = f.w.inbox(f.bank)[0];
    f.w.moderate(f.mod, r.id, 1, 'withhold', 'Fictional reviewer found an unsupported allegation.');
    assert.equal(f.w.community().experiences.length, 0); assert(f.w.inbox(f.bank)[0].staleReason);
    denied(() => f.w.respond(f.bank, n.id, 'acknowledged', 'Fictional late acknowledgement.'), 409);
    assert.equal(f.w.journey(f.a, r.id).moderation.length, 2);
  } finally { f.store.close(); }
});

test('withdrawal cancels undelivered queue entries and retry cannot deliver them', async () => {
  const f = fixture(); try {
    const r = await submitted(f); f.store.db.exec("CREATE TRIGGER fail_delivery BEFORE UPDATE OF status ON notifications WHEN NEW.status='delivered' BEGIN SELECT RAISE(ABORT,'failure'); END;");
    approve(f, r.id); f.w.withdraw(f.a, r.id, 1, 'Fictional withdrawal before delivery.');
    f.store.db.exec('DROP TRIGGER fail_delivery'); assert.equal(f.w.deliverPending(f.mod).delivered, 0);
    assert(f.w.journey(f.a, r.id).notifications.every(n => n.status === 'cancelled')); assert.equal(f.w.inbox(f.bank).length, 0);
  } finally { f.store.close(); }
});
