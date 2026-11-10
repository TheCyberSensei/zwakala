import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../lib/store.ts';
import { handle } from '../lib/http.ts';
import { communityApprovalFor, prepareCommunityVersion, validateReport, writtenLanguages } from '../lib/domain.ts';
import type { ReportInput } from '../lib/domain.ts';

const input = (): ReportInput => ({ fictional: true, title: 'Fictional impersonation example', narrative: 'FICTIONAL: Example Bank was impersonated in a message sent via Example Mobile. Ngiyabonga — this is mixed text.', incidentDate: '2026-11-01', channel: 'SMS', outcome: 'attempted', languages: ['English', 'isiZulu'], associations: [
  { institutionId: 'demo-bank', relationship: 'impersonated', allowInstitutionSharing: true },
  { institutionId: 'demo-mobile', relationship: 'service_involved', allowInstitutionSharing: false },
], allowCommunitySharing: false, communityText: '', communityApproval: null });
function fixture() {
  const store = new Store(':memory:');
  const accounts = store.seedAccounts();
  const credentials = (id: string) => accounts.find(x => x.actor.id === id)!;
  const login = (id: string) => { const { key } = credentials(id); return store.signIn(id, key); };
  const a = login('contributor-a'), b = login('contributor-b'), mod = login('moderator'), bank = login('institution-bank'), mobile = login('institution-mobile');
  return { store, credentials, a, b, mod, bank, mobile };
}
const f = fixture();
test.after(() => f.store.close());
function request(path: string, token?: string, method = 'GET', data?: unknown, extra: Record<string, string> = {}) {
  return new Request(`http://127.0.0.1:3000/api/${path}`, { method, headers: { ...(token ? { Cookie: `demo_session=${token}` } : {}), ...(method !== 'GET' ? { Origin: 'http://127.0.0.1:3000', 'Content-Type': 'application/json' } : {}), ...extra }, body: data === undefined ? undefined : JSON.stringify(data) });
}
const call = (path: string, token?: string, method = 'GET', data?: unknown, extra?: Record<string, string>) => handle(request(path, token, method, data, extra), f.store);
test('all 11 written languages and mixed-language original are preserved exactly', () => {
  assert.equal(writtenLanguages.length, 11); assert(writtenLanguages.includes('\u0058itsonga'));
  const v = input(); v.languages = [...writtenLanguages, 'Mixed / other']; v.narrative += '\nisiZulu: Ngithole umyalezo. Afrikaans: Ek het niks gestuur nie. 👋';
  assert.deepEqual(validateReport(v), v);
});
test('unauthenticated direct API requests cannot list, read or create reports', async () => {
  for (const [path, method, data] of [['reports', 'GET', undefined], ['reports/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'GET', undefined], ['reports', 'POST', input()]] as const) {
    const res = await call(path, undefined, method, data); assert.equal(res.status, 401); assert.equal(res.headers.get('cache-control'), 'private, no-store');
  }
});
test('API create and read preserve multiple institutions and distinct disclosure choices', async () => {
  const res = await call('reports', f.a, 'POST', input()); assert.equal(res.status, 201);
  const { report } = await res.json(); assert.equal(report.ownerId, 'contributor-a'); assert.equal(report.status, 'private');
  assert.deepEqual(report.associations, input().associations); assert.equal(report.allowCommunitySharing, false);
  const fetched = await (await call(`reports/${report.id}`, f.a)).json(); assert.deepEqual(fetched.report, report);
});
test('other contributor and both institutions cannot read even with sharing permission', async () => {
  const report = f.store.create(f.store.actor(f.a), input());
  for (const other of [f.b, f.bank, f.mobile]) {
    const response = await call(`reports/${report.id}`, other); assert.equal(response.status, 404);
    const listing = await (await call('reports', other)).json(); assert(!listing.reports.some((r: { id: string }) => r.id === report.id));
  }
  assert.equal((await call(`reports/${report.id}`, f.mod)).status, 200);
});
test('server rejects forged identity/status and never accepts role or owner from input', async () => {
  for (const extra of [{ ownerId: 'contributor-b' }, { role: 'moderator' }, { status: 'published' }, { id: 'chosen-id' }])
    assert.equal((await call('reports', f.a, 'POST', { ...input(), ...extra })).status, 400);
  assert.equal((await call('reports', undefined, 'GET', undefined, { 'x-user-id': 'moderator' })).status, 401);
});
test('moderator and institution sessions cannot create or edit contributor accounts', async () => {
  const report = f.store.create(f.store.actor(f.a), input());
  for (const other of [f.mod, f.bank, f.mobile]) {
    assert.equal((await call('reports', other, 'POST', input())).status, 403);
    assert.equal((await call(`reports/${report.id}`, other, 'PUT', { version: 1, report: input() })).status, 403);
  }
  assert.equal((await call(`reports/${report.id}`, f.b, 'PUT', { version: 1, report: input() })).status, 404);
});
test('contributor updates disclosure; stale-tab writes cannot overwrite it', async () => {
  const report = f.store.create(f.store.actor(f.a), input());
  const changed = input(); changed.associations[0].allowInstitutionSharing = false; changed.allowCommunitySharing = true; changed.communityText = 'Fictional public-safe version.';
  changed.communityApproval = await communityApprovalFor(changed.narrative, changed.communityText);
  const updated = await (await call(`reports/${report.id}`, f.a, 'PUT', { version: 1, report: changed })).json();
  assert.equal(updated.report.version, 2); assert.equal(updated.report.associations[0].allowInstitutionSharing, false);
  assert.equal((await call(`reports/${report.id}`, f.a, 'PUT', { version: 1, report: input() })).status, 409);
  assert.deepEqual(f.store.read(f.store.actor(f.a), report.id), updated.report);
});
test('different relationships to the same institution are permitted; exact duplicates are rejected', () => {
  const v = input(); v.associations.push({ institutionId: 'demo-bank', relationship: 'potential_responder', allowInstitutionSharing: false });
  assert.equal(validateReport(v).associations.length, 3);
  v.associations.push(v.associations[0]); assert.throws(() => validateReport(v), /repeat/);
});
test('no institution association is required to save a private account', () => {
  const v = input(); v.associations = []; assert.deepEqual(validateReport(v).associations, []);
});
test('community sharing requires an explicit approval, while private-only reporting needs no second narrative', async () => {
  assert.equal(validateReport(input()).communityText, '');
  const v = input(); v.allowCommunitySharing = true; assert.throws(() => validateReport(v), /Community version/);
  v.communityText = prepareCommunityVersion(v.narrative); assert.equal(v.communityText, v.narrative);
  assert.throws(() => validateReport(v), /approve the exact/);
  v.communityApproval = await communityApprovalFor(v.narrative, v.communityText);
  assert.deepEqual(validateReport(v), v);
});
test('validation rejects unsafe, malformed or overlong data without inserting rows', async () => {
  const before = f.store.list(f.store.actor(f.a)).length;
  const cases: unknown[] = [null, [], { ...input(), fictional: false }, { ...input(), title: 'x' }, { ...input(), narrative: 'x'.repeat(6001) }, { ...input(), narrative: 'bad\u0000'.repeat(20) }, { ...input(), languages: [] }, { ...input(), languages: ['invented'] }, { ...input(), incidentDate: '2026-02-30' }, { ...input(), incidentDate: '2099-01-01' }, { ...input(), channel: 'invented' }, { ...input(), outcome: 'proved_crime' }, { ...input(), allowCommunitySharing: 'true' }, { ...input(), associations: [{ institutionId: 'real-bank', relationship: 'responsible', allowInstitutionSharing: true }] }];
  for (const value of cases) assert.equal((await call('reports', f.a, 'POST', value)).status, 400);
  assert.equal(f.store.list(f.store.actor(f.a)).length, before);
});
test('SQL and markup payloads stay inert text in storage', () => {
  const v = input(); v.title = "Fictional '); DROP TABLE reports; --"; v.narrative = '<script>globalThis.attacked=true</script> FICTIONAL';
  const saved = f.store.create(f.store.actor(f.a), v); assert.equal(saved.narrative, v.narrative);
  assert(f.store.list(f.store.actor(f.a)).length > 0);
});
test('CSRF, missing origin and non-loopback requests fail before mutation', async () => {
  for (const origin of ['', 'https://attacker.example', 'http://localhost:3000']) assert.equal((await call('reports', f.a, 'POST', input(), { Origin: origin })).status, 403);
  assert.equal((await call('reports', f.a, 'POST', input(), { 'sec-fetch-site': 'cross-site' })).status, 403);
  const external = new Request('http://attacker.example/api/reports', { headers: { Cookie: `demo_session=${f.a}` } });
  assert.equal((await handle(external, f.store)).status, 403);
});
test('body limit, non-JSON content, invalid JSON and unknown endpoints fail safely', async () => {
  assert.equal((await call('reports', f.a, 'POST', { text: 'a'.repeat(65_000) })).status, 413);
  assert.equal((await call('reports', f.a, 'POST', input(), { 'Content-Type': 'text/plain' })).status, 415);
  const invalid = new Request('http://127.0.0.1:3000/api/reports', { method: 'POST', headers: { Origin: 'http://127.0.0.1:3000', Cookie: `demo_session=${f.a}`, 'Content-Type': 'application/json' }, body: '{' });
  assert.equal((await handle(invalid, f.store)).status, 400);
  assert.equal((await call('public-reports', f.a)).status, 404);
});
test('origin check accepts Next internal URL rewriting only with a matching validated local Host', async () => {
  const rewritten = new Request('http://localhost:3000/api/reports', { method: 'POST', headers: {
    Host: '127.0.0.1:3100', Origin: 'http://127.0.0.1:3100', Cookie: `demo_session=${f.a}`, 'Content-Type': 'application/json',
  }, body: JSON.stringify(input()) });
  assert.equal((await handle(rewritten, f.store)).status, 201);
  assert.equal((await call('reports', f.a, 'POST', input(), { Host: 'attacker.example', Origin: 'http://attacker.example' })).status, 403);
  assert.equal((await call('reports', f.a, 'POST', input(), { Host: 'localhost:3100', Origin: 'http://127.0.0.1:3100' })).status, 403);
});
test('failed local key-file creation rolls back account provisioning', () => {
  const store = new Store(':memory:');
  try {
    assert.throws(() => store.seedAccounts(() => { throw new Error('synthetic file failure'); }), /synthetic file failure/);
    assert.equal(store.db.prepare('SELECT count(*) AS n FROM actors').get()!.n, 0);
    assert.equal(store.seedAccounts().length, 5);
  } finally { store.close(); }
});
test('login issues opaque HttpOnly SameSite cookie; logout revokes server session', async () => {
  const { key } = f.credentials('contributor-a');
  const response = await call('session', undefined, 'POST', { account: 'contributor-a', key });
  assert.equal(response.status, 200); const cookie = response.headers.get('set-cookie')!;
  assert(cookie.includes('HttpOnly')); assert(cookie.includes('SameSite=Strict')); assert(!cookie.includes(key));
  const session = cookie.split(';')[0].split('=')[1];
  assert.equal((await call('session', session)).status, 200);
  assert.equal((await call('session', session, 'DELETE')).status, 200);
  assert.equal((await call('session', session)).status, 401);
});
test('tampered and expired sessions are rejected', async () => {
  assert.equal((await call('reports', f.a.slice(0, -1) + '!')).status, 401);
  const isolated = fixture(); isolated.store.db.exec('UPDATE sessions SET expires=0');
  assert.equal((await handle(request('reports', isolated.a), isolated.store)).status, 401); isolated.store.close();
});
test('passwords and session tokens are hashed; sign-in attempts are bounded', () => {
  const local = fixture();
  try {
    const serialized = JSON.stringify(local.store.db.prepare('SELECT * FROM actors').all()) + JSON.stringify(local.store.db.prepare('SELECT * FROM sessions').all());
    assert(!serialized.includes(local.a)); assert(!serialized.includes(local.credentials('contributor-a').key));
    for (let i = 0; i < 5; i++) assert.throws(() => local.store.signIn('missing', 'wrong'), /incorrect/);
    assert.throws(() => local.store.signIn('missing', 'wrong'), /Too many/);
  } finally { local.store.close(); }
});
test('reports, associations, consent, events and session survive database close/reopen', () => {
  const dir = mkdtempSync(join(tmpdir(), 'digital-safety-test-')); const path = join(dir, 'fixture.sqlite');
  let store = new Store(path);
  try {
    const [{ actor, key }] = store.seedAccounts(); const session = store.signIn(actor.id, key);
    const saved = store.create(store.actor(session), input()); store.close(); store = new Store(path);
    assert.deepEqual(store.read(store.actor(session), saved.id), saved);
    const events = store.db.prepare('SELECT kind,version FROM events').all(); assert.equal(events.length, 1); assert.equal(events[0].kind, 'private_report_saved');
    assert.throws(() => store.seedAccounts(), /already exist/);
  } finally { store.close(); rmSync(dir, { recursive: true, force: true }); }
});
test('transaction rolls back partial report construction and audit event on storage failure', () => {
  const local = fixture();
  try {
    local.store.db.exec("CREATE TRIGGER fail_insert BEFORE INSERT ON associations BEGIN SELECT RAISE(ABORT, 'synthetic failure'); END;");
    assert.throws(() => local.store.create(local.store.actor(local.a), input()), /synthetic failure/);
    assert.equal(local.store.list(local.store.actor(local.a)).length, 0);
    assert.equal(local.store.db.prepare('SELECT count(*) AS n FROM events').get()!.n, 0);
  } finally { local.store.close(); }
});
test('unexpected storage failures return no database details or narrative', async () => {
  const local = fixture(); local.store.db.exec("CREATE TRIGGER fail_insert BEFORE INSERT ON reports BEGIN SELECT RAISE(ABORT, 'secret internal detail'); END;");
  try { const response = await handle(request('reports', local.a, 'POST', input()), local.store); assert.equal(response.status, 500); assert(!JSON.stringify(await response.json()).includes('secret internal detail')); }
  finally { local.store.close(); }
});

test('exact community approval is checked by the server and stamped with report version and time', async () => {
  const v = input(); v.allowCommunitySharing = true; v.communityText = 'FICTIONAL: a message impersonated an organisation.';
  assert.equal((await call('reports', f.a, 'POST', v)).status, 400);
  v.communityApproval = { sourceDigest: '0'.repeat(64), textDigest: '0'.repeat(64) };
  assert.equal((await call('reports', f.a, 'POST', v)).status, 400);
  v.communityApproval = await communityApprovalFor(v.narrative, v.communityText);
  const result = await call('reports', f.a, 'POST', v); assert.equal(result.status, 201);
  const { report } = await result.json(); assert.equal(report.communityApprovalVersion, 1);
  assert(Number.isFinite(Date.parse(report.communityApprovedAt))); assert.deepEqual(report.communityApproval, v.communityApproval);
  assert.equal(report.status, 'private'); assert.equal(report.narrative, v.narrative);
  for (const token of [f.b, f.bank, f.mobile]) assert.equal((await call('reports/' + report.id, token)).status, 404);
});

test('editing either source or proposed text rejects stale approval without changing saved data', async () => {
  const v = input(); v.allowCommunitySharing = true; v.communityText = prepareCommunityVersion(v.narrative);
  v.communityApproval = await communityApprovalFor(v.narrative, v.communityText);
  const saved = f.store.create(f.store.actor(f.a), v);
  for (const changed of [{ ...v, narrative: v.narrative + '\nNew fictional detail.' }, { ...v, communityText: v.communityText + ' Changed wording.' }]) {
    const result = await call('reports/' + saved.id, f.a, 'PUT', { version: 1, report: changed }); assert.equal(result.status, 400);
    assert.deepEqual(f.store.read(f.store.actor(f.a), saved.id), saved);
  }
  const changed = { ...v, narrative: v.narrative + '\nNew fictional detail.' };
  changed.communityApproval = await communityApprovalFor(changed.narrative, changed.communityText);
  const updated = f.store.update(f.store.actor(f.a), saved.id, 1, changed);
  assert.equal(updated.communityApprovalVersion, 2); assert.equal(updated.communityText, v.communityText);
  assert.equal(updated.narrative, changed.narrative); assert.notDeepEqual(updated.communityApproval, saved.communityApproval);
  assert.throws(() => f.store.update(f.store.actor(f.a), saved.id, 1, v), /another tab/);
});

test('turning community sharing off clears approval while retaining institution-specific choices', async () => {
  const v = input(); v.allowCommunitySharing = true; v.communityText = prepareCommunityVersion(v.narrative); v.communityApproval = await communityApprovalFor(v.narrative, v.communityText);
  const saved = f.store.create(f.store.actor(f.a), v);
  assert.throws(() => validateReport({ ...v, allowCommunitySharing: false }), /cleared/);
  const changed = { ...v, allowCommunitySharing: false, communityApproval: null };
  const updated = f.store.update(f.store.actor(f.a), saved.id, 1, changed);
  assert.equal(updated.communityApproval, null); assert.equal(updated.communityApprovedAt, null); assert.equal(updated.communityApprovalVersion, null);
  assert.deepEqual(updated.associations, v.associations); assert.equal(updated.communityText, v.communityText);
  assert.equal((await call('reports', f.a, 'POST', { ...changed, allowCommunitySharing: true })).status, 400);
});

test('organisation connections can be corrected or removed without widening other permissions', () => {
  const v = input(); const saved = f.store.create(f.store.actor(f.a), v);
  const changed = input(); changed.associations = [{ institutionId: 'demo-payments', relationship: 'unclear', allowInstitutionSharing: false }];
  const updated = f.store.update(f.store.actor(f.a), saved.id, 1, changed);
  assert.deepEqual(updated.associations, changed.associations); assert.equal(updated.allowCommunitySharing, false);
  assert.equal(f.store.db.prepare('SELECT count(*) AS n FROM associations WHERE reportId=?').get(saved.id)!.n, 1);
});

test('legacy reports and existing keys remain usable; earlier sharing intent is not exact approval', () => {
  const dir = mkdtempSync(join(tmpdir(), 'digital-safety-legacy-')); const path = join(dir, 'fixture.sqlite');
  let store = new Store(path);
  try {
    const [{ actor, key }] = store.seedAccounts(); const token = store.signIn(actor.id, key);
    const saved = store.create(store.actor(token), input());
    const { associations: _associations, communityApproval: _approval, ...legacy } = input();
    legacy.allowCommunitySharing = true; legacy.communityText = 'Fictional community draft from the previous interface.';
    const raw = JSON.stringify(legacy); store.db.prepare('UPDATE reports SET data=? WHERE id=?').run(raw, saved.id);
    store.close(); store = new Store(path);
    const existing = store.read(store.actor(store.signIn(actor.id, key)), saved.id);
    assert.equal(existing.communityText, legacy.communityText); assert.equal(existing.narrative, legacy.narrative);
    assert.equal(existing.allowCommunitySharing, true); assert.equal(existing.communityApproval, null);
    assert.equal(existing.communityApprovedAt, null); assert.equal(existing.version, 1);
    assert.equal(store.db.prepare('SELECT data FROM reports WHERE id=?').get(saved.id)!.data, raw);
    assert.equal(existing.associations.length, 2);
  } finally { store.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('copying a maximum-length mixed-language original neither truncates it nor exceeds the API body bound', async () => {
  const v = input(); v.narrative = '語'.repeat(6000); v.allowCommunitySharing = true;
  v.communityText = prepareCommunityVersion(v.narrative); v.communityApproval = await communityApprovalFor(v.narrative, v.communityText);
  assert.equal(v.communityText.length, 6000); assert.equal((await call('reports', f.a, 'POST', v)).status, 201);
});

test('unchanged exact approval survives unrelated metadata edits without inventing a new approval time', async () => {
  const v = input(); v.allowCommunitySharing = true; v.communityText = prepareCommunityVersion(v.narrative); v.communityApproval = await communityApprovalFor(v.narrative, v.communityText);
  const saved = f.store.create(f.store.actor(f.a), v);
  const updated = f.store.update(f.store.actor(f.a), saved.id, 1, { ...v, title: 'A revised fictional title' });
  assert.equal(updated.communityApprovedAt, saved.communityApprovedAt); assert.equal(updated.communityApprovalVersion, 1);
  assert.equal(updated.version, 2);
  assert.equal((await call('reports', f.a, 'POST', { ...v, communityApprovedAt: '2000-01-01' })).status, 400);
});
