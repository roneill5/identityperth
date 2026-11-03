import type { APIRoute } from 'astro';
import { PREVIEW_COOKIE, PREVIEW_COOKIE_PATH } from '../../middleware';

export const prerender = false;

export const GET: APIRoute = ({ cookies, redirect }) => {
	cookies.delete(PREVIEW_COOKIE, { path: PREVIEW_COOKIE_PATH });
	return redirect('/', 307);
};
