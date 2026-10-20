import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * The Sanity Studio under /backend is a single-page app, so any path there
 * that is not a real file gets the Studio's index page and the Studio's own
 * router takes it from there. Real files (and the index itself) come
 * straight from the asset store.
 */
export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
	const assets = (env as { ASSETS?: { fetch(request: Request): Promise<Response> } }).ASSETS;
	if (!assets) return new Response('Not found', { status: 404 });
	const direct = await assets.fetch(request);
	const looksLikeFile = /\.[a-z0-9]+$/i.test(new URL(request.url).pathname);
	if (direct.status !== 404 || looksLikeFile) return direct;
	return assets.fetch(new Request(new URL('/backend/', request.url), request));
};
