import type { APIRoute } from 'astro';
import { validatePreviewUrl } from '@sanity/preview-url-secret';
import { previewClient } from '../../sanity/client';
import { PREVIEW_COOKIE, readToken } from '../../middleware';

/** The Studio's Presentation tool opens this with a one-time secret; a valid one earns the preview cookie. */
export const prerender = false;

export const GET: APIRoute = async ({ request, cookies, redirect }) => {
	const token = readToken();
	if (!token) return new Response('SANITY_READ_TOKEN is not set on the server.', { status: 500 });
	const { isValid, redirectTo } = await validatePreviewUrl(previewClient(token), request.url);
	if (!isValid) return new Response('Invalid preview secret.', { status: 401 });
	cookies.set(PREVIEW_COOKIE, '1', {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: request.url.startsWith('https'),
		maxAge: 60 * 60 * 24,
	});
	return redirect(redirectTo === '/' ? '/preview' : `/preview${redirectTo}`, 307);
};
