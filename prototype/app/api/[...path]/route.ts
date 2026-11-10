import { handle } from '../../../lib/http.ts';
import { Store } from '../../../lib/store.ts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
async function route(request: Request) {
  let store: Store | undefined;
  try { store = new Store(); return await handle(request, store); }
  catch { return Response.json({ error: 'Private storage is unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } }); }
  finally { store?.close(); }
}
export { route as GET, route as POST, route as PUT, route as DELETE };
