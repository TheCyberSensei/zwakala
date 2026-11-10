export class RequestError extends Error { constructor(message: string, public status: number) { super(message); } }
export async function api(path: string, method = 'GET', data?: unknown) {
  const response = await fetch('/api/' + path, { method, cache: 'no-store', credentials: 'same-origin', headers: data === undefined ? {} : { 'Content-Type': 'application/json' }, body: data === undefined ? undefined : JSON.stringify(data) });
  const result = await response.json();
  if (!response.ok) throw new RequestError(result.error ?? 'Request failed. Please retry.', response.status);
  return result;
}
