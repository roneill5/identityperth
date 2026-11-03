import { env } from 'cloudflare:workers';

/**
 * The Studio's video routes, /backend/api/stream/* (Ross, 3 Nov): editors
 * upload to Cloudflare Stream from the video field, browse the account's
 * videos and watch processing (backend/components/StreamVideoInput.tsx).
 * Every request carries the editor's own Studio session token, which is
 * checked against the Sanity project: only an administrator or editor of
 * the dataset may mint upload URLs or list videos. The Stream token itself
 * is the Worker secret STREAM_API_TOKEN and never reaches the browser; the
 * file goes from the editor's browser straight to Stream's one-time upload
 * URL, so the Worker only ever handles small JSON.
 */
export const STREAM_ACCOUNT = '52679bd17ed4c9b4f19165dd37d76f7d';
const PROJECT_ID = import.meta.env.PUBLIC_SANITY_PROJECT_ID;
const ALLOWED_ROLES = new Set(['administrator', 'editor']);
const HEADERS = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' };

export const UID = /^[a-f0-9]{32}$/i;

export const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: HEADERS });

function streamToken(): string | undefined {
	return (env as { STREAM_API_TOKEN?: string }).STREAM_API_TOKEN;
}

/** The editor behind the request, or null when the token is missing, invalid or not an editor's. */
export async function verifyEditor(request: Request): Promise<{ id: string; name: string } | null> {
	const auth = request.headers.get('Authorization') ?? '';
	const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
	if (!/^[A-Za-z0-9_.-]{20,}$/.test(token)) return null;
	const res = await fetch(`https://${PROJECT_ID}.api.sanity.io/v2025-01-01/users/me`, { headers: { Authorization: `Bearer ${token}` } });
	if (!res.ok) return null;
	const user = (await res.json().catch(() => null)) as { id?: string; name?: string; roles?: { name?: string }[] } | null;
	if (!user?.id || !user.roles?.some((r) => r.name && ALLOWED_ROLES.has(r.name))) return null;
	return { id: user.id, name: user.name ?? '' };
}

/** A call to the Stream API for this account; throws with Cloudflare's message. */
export async function stream(path: string, init: RequestInit = {}): Promise<any> {
	const token = streamToken();
	if (!token) throw new Error('STREAM_API_TOKEN is not set on the Worker');
	const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${STREAM_ACCOUNT}/stream${path}`, {
		...init,
		headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
	});
	const data = (await res.json().catch(() => ({}))) as { success?: boolean; result?: unknown; errors?: { message: string }[] };
	if (!res.ok || data.success === false) throw new Error(data.errors?.map((e) => e.message).join('; ') || `Stream answered ${res.status}`);
	return data.result;
}

/** Guards a route: 500 without the secret, 401 without an editor, then runs it. */
export async function guarded(request: Request, run: () => Promise<Response>): Promise<Response> {
	if (!streamToken()) return json({ error: 'Video uploads are not set up on this server.' }, 500);
	if (!(await verifyEditor(request))) return json({ error: 'Sign in to the Studio to manage videos.' }, 401);
	try {
		return await run();
	} catch (e) {
		return json({ error: e instanceof Error ? e.message : 'Something went wrong' }, 502);
	}
}

/** What the Studio shows for a video. */
export function summarise(v: any) {
	return {
		uid: v.uid,
		name: v.meta?.name ?? '',
		duration: typeof v.duration === 'number' && v.duration > 0 ? v.duration : null,
		created: v.created ?? null,
		ready: Boolean(v.readyToStream),
		state: v.status?.state ?? null,
		error: v.status?.errReasonText ?? null,
		width: v.input?.width ?? null,
		height: v.input?.height ?? null,
		size: v.size ?? null,
	};
}
