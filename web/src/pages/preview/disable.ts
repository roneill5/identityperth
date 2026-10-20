import type { APIRoute } from 'astro';
import { PREVIEW_COOKIE } from '../../middleware';

export const prerender = false;

export const GET: APIRoute = ({ cookies, redirect }) => {
	cookies.delete(PREVIEW_COOKIE, { path: '/' });
	return redirect('/', 307);
};
