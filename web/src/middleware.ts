import { defineMiddleware } from 'astro:middleware';
import { env } from 'cloudflare:workers';
import { previewClient } from './sanity/client';

/**
 * Guards the editors' preview. Anything under /preview (other than the
 * enable and disable endpoints) needs the cookie that /preview/enable sets
 * after the Studio proves itself; with it, the request gets a drafts
 * client and the page is rendered fresh and never cached or indexed.
 */
export const PREVIEW_COOKIE = 'idp-preview';

/** The Viewer token: a Worker secret in production, .dev.vars in astro dev. */
export function readToken(): string | undefined {
	return (env as { SANITY_READ_TOKEN?: string }).SANITY_READ_TOKEN;
}

export const onRequest = defineMiddleware(async (context, next) => {
	const { pathname } = context.url;
	if (!/^\/preview(\/|$)/.test(pathname)) return next();
	if (pathname === '/preview/enable' || pathname === '/preview/disable') return next();

	if (context.cookies.get(PREVIEW_COOKIE)?.value !== '1') {
		return new Response('The preview opens from the Studio at /backend.', { status: 401 });
	}
	const token = readToken();
	if (!token) return new Response('SANITY_READ_TOKEN is not set on the server.', { status: 500 });

	context.locals.preview = true;
	context.locals.sanity = previewClient(token);
	const response = await next();
	response.headers.set('Cache-Control', 'no-store');
	response.headers.set('X-Robots-Tag', 'noindex');
	return response;
});
