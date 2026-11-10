import { AppError } from './domain.ts';
import type { Store } from './store.ts';
import { fields, Workflow } from './workflow.ts';

const cookieName = 'demo_session';
const headers = { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie', 'X-Content-Type-Options': 'nosniff' };
const json = (data: unknown, status = 200, extra = {}) => Response.json(data, { status, headers: { ...headers, ...extra } });
function token(request: Request) {
  return request.headers.get('cookie')?.split(';').map(s => s.trim()).find(s => s.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
}
async function body(request: Request): Promise<Record<string, unknown>> {
  if (request.headers.get('content-type')?.split(';')[0] !== 'application/json') throw new AppError(415, 'Send JSON content.');
  const reader = request.body?.getReader();
  if (!reader) throw new AppError(400, 'A request body is required.');
  let length = 0; const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    length += value.length;
    if (length > 64_000) { await reader.cancel(); throw new AppError(413, 'Report is too large. Reduce the text and retry.'); }
    chunks.push(value);
  }
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    return value;
  } catch { throw new AppError(400, 'Request is not a valid JSON object.'); }
}
export async function handle(request: Request, store: Store): Promise<Response> {
  try {
    const url = new URL(request.url);
    if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) throw new AppError(403, 'This demonstration is local only.');
    // Next may use its internal hostname/port in request.url. Compare the browser
    // Origin with the validated HTTP Host instead; never trust forwarded headers.
    const host = request.headers.get('host') ?? url.host;
    const browserOrigin = new URL(`${url.protocol}//${host}`);
    if (!['127.0.0.1', 'localhost', '[::1]'].includes(browserOrigin.hostname) || browserOrigin.host !== host)
      throw new AppError(403, 'This demonstration is local only.');
    const method = request.method;
    if (!['GET', 'POST', 'PUT', 'DELETE'].includes(method)) throw new AppError(405, 'Method not supported.');
    if (method !== 'GET' && (request.headers.get('origin') !== browserOrigin.origin || request.headers.get('sec-fetch-site') === 'cross-site'))
      throw new AppError(403, 'This request must come from the local application.');
    const path = url.pathname.replace(/\/$/, '');
    if (path === '/api/session' && method === 'POST') {
      const v = await body(request);
      if (Object.keys(v).some(k => !['account', 'key'].includes(k)) || typeof v.account !== 'string' || typeof v.key !== 'string' || v.account.length > 80 || v.key.length > 200)
        throw new AppError(400, 'Provide an account and demo key.');
      const session = store.signIn(v.account, v.key);
      const old = token(request); if (old) store.signOut(old);
      return json({ actor: store.actor(session) }, 200, { 'Set-Cookie': `${cookieName}=${session}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${url.protocol === 'https:' ? '; Secure' : ''}` });
    }
    const session = token(request);
    const actor = store.actor(session);
    const workflow = new Workflow(store);
    if (path === '/api/session' && method === 'GET') return json({ actor });
    if (path === '/api/session' && method === 'DELETE') {
      store.signOut(session!);
      return json({ signedOut: true }, 200, { 'Set-Cookie': `${cookieName}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0` });
    }
    if (path === '/api/reports' && method === 'GET') return json({ reports: store.list(actor) });
    if (path === '/api/reports' && method === 'POST') return json({ report: store.create(actor, await body(request)) }, 201);
    if (path === '/api/community' && method === 'GET') return json(workflow.community());
    if (path === '/api/moderation' && method === 'GET') return json({ queue: workflow.queue(actor), suggestions: workflow.suggestions(actor) });
    if (path === '/api/inbox' && method === 'GET') return json({ notifications: workflow.inbox(actor) });
    if (path === '/api/deliveries/retry' && method === 'POST') { const v = await body(request); fields(v, []); return json(workflow.deliverPending(actor)); }
    if (path === '/api/links' && method === 'POST') return json(workflow.decideLink(actor, await body(request)));
    if (path === '/api/notices' && method === 'POST') { const v = await body(request); fields(v, ['linkId', 'reason']); return json(workflow.publishNotice(actor, String(v.linkId), v.reason)); }
    const action = /^\/api\/reports\/([0-9a-f-]{36})\/(journey|submit|moderate|withdraw)$/.exec(path);
    if (action && method === 'GET' && action[2] === 'journey') return json(workflow.journey(actor, action[1]));
    if (action && method === 'POST') {
      const v = await body(request);
      if (action[2] === 'submit') { fields(v, ['version']); return json(workflow.submit(actor, action[1], v.version)); }
      if (action[2] === 'moderate') { fields(v, ['version', 'decision', 'reason']); return json(workflow.moderate(actor, action[1], v.version, v.decision, v.reason)); }
      if (action[2] === 'withdraw') { fields(v, ['version', 'reason']); return json(workflow.withdraw(actor, action[1], v.version, v.reason)); }
    }
    const update = /^\/api\/inbox\/([0-9a-f-]{36})\/updates$/.exec(path);
    if (update && method === 'POST') { const v = await body(request); fields(v, ['kind', 'message']); return json(workflow.respond(actor, update[1], v.kind, v.message)); }
    const feedback = /^\/api\/updates\/([0-9a-f-]{36})\/feedback$/.exec(path);
    if (feedback && method === 'POST') { const v = await body(request); fields(v, ['decision', 'reason']); return json(workflow.feedback(actor, feedback[1], v.decision, v.reason)); }
    const id = /^\/api\/reports\/([0-9a-f-]{36})$/.exec(path)?.[1];
    if (id && method === 'GET') return json({ report: store.read(actor, id) });
    if (id && method === 'PUT') {
      const v = await body(request);
      if (Object.keys(v).some(k => !['version', 'report'].includes(k))) throw new AppError(400, 'Unexpected update fields.');
      return json({ report: store.update(actor, id, v.version as number, v.report) });
    }
    throw new AppError(404, 'Endpoint not found.');
  } catch (error) {
    if (error instanceof AppError) return json({ error: error.message }, error.status);
    // No narrative, credentials or database errors in responses or application logs.
    return json({ error: 'The private store could not complete this request. Retry; your unsaved text remains in the form.' }, 500);
  }
}
