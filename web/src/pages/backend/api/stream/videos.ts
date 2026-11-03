import type { APIRoute } from 'astro';
import { guarded, json, stream, summarise } from '../../../../lib/stream-admin';

/** GET ?search=: the account's videos, newest first, for the Studio's library picker. */
export const prerender = false;

export const GET: APIRoute = ({ request }) =>
	guarded(request, async () => {
		const search = (new URL(request.url).searchParams.get('search') ?? '').trim().slice(0, 80);
		const params = new URLSearchParams({ limit: '200', asc: 'false' });
		if (search) params.set('search', search);
		const list = (await stream(`?${params}`)) as unknown[];
		return json({ videos: list.map(summarise) });
	});
