import type { APIRoute } from 'astro';
import { validatePreviewUrl } from '@sanity/preview-url-secret';
import { previewClient } from '../../sanity/client';
import { PREVIEW_COOKIE, PREVIEW_COOKIE_PATH, previewCookieValue, readToken } from '../../middleware';

/** The Studio's Presentation tool opens this with a one-time secret; a valid one earns the signed preview cookie. */
export const prerender = false;

export const GET: APIRoute = async ({ request, cookies, redirect }) => {
	const token = readToken();
	if (!token) return new Response('The preview is not set up on this server.', { status: 500 });
	const { isValid, redirectTo } = await validatePreviewUrl(previewClient(token), request.url);
	if (!isValid) return new Response('Invalid preview secret.', { status: 401 });
	// The cookie lived at the root path until 28 Oct; a browser still holding that one would send it first.
	cookies.delete(PREVIEW_COOKIE, { path: '/' });
	cookies.set(PREVIEW_COOKIE, await previewCookieValue(token), {
		path: PREVIEW_COOKIE_PATH,
		httpOnly: true,
		sameSite: 'lax',
		secure: import.meta.env.PROD,
		maxAge: 60 * 60 * 12,
	});
	return redirect(redirectTo === '/' ? '/preview' : `/preview${redirectTo}`, 307);
};
