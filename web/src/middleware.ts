import { defineMiddleware } from 'astro:middleware';
import { env } from 'cloudflare:workers';
import { previewClient } from './sanity/client';

/**
 * Guards the editors' preview. Anything under /preview (other than the
 * enable and disable endpoints) needs the cookie that /preview/enable sets
 * after the Studio proves itself; with it, the request gets a drafts
 * client and the page is rendered fresh and never cached or indexed.
 *
 * The cookie cannot be made up: its value is an expiry time and an HMAC of
 * that time keyed by the server's Sanity token, checked in constant time
 * (security review, 28 Oct; before that the value was a fixed "1"). The
 * login itself is checked by the Studio when it mints the one-time secret,
 * so a visitor without the cookie is sent to the Studio to log in, and the
 * Studio opens the preview of the page they wanted (Ross, 28 Oct).
 */
export const PREVIEW_COOKIE = 'idp-preview';
export const PREVIEW_COOKIE_PATH = '/preview';
const PREVIEW_HOURS = 12;

/** The Viewer token: a Worker secret in production, .dev.vars in astro dev. */
export function readToken(): string | undefined {
	return (env as { SANITY_READ_TOKEN?: string }).SANITY_READ_TOKEN;
}

/** A fresh cookie value: "<expiry ms>.<hmac>". */
export async function previewCookieValue(token: string, now = Date.now()): Promise<string> {
	const expiry = String(now + PREVIEW_HOURS * 60 * 60 * 1000);
	return `${expiry}.${await sign(token, expiry)}`;
}

export async function previewCookieValid(token: string, value: string | undefined, now = Date.now()): Promise<boolean> {
	const [expiry, mac] = (value ?? '').split('.');
	if (!expiry || !mac || !/^\d{1,16}$/.test(expiry) || Number(expiry) < now) return false;
	return constantTimeEqual(await sign(token, expiry), mac);
}

/**
 * Every value sent under the cookie's name. A browser that still holds the
 * old root-path cookie sends it alongside the new one, and the first would
 * otherwise hide the valid one.
 */
function cookieValues(header: string | null, name: string): string[] {
	return (header ?? '')
		.split(';')
		.map((part) => part.trim())
		.filter((part) => part.startsWith(`${name}=`))
		.map((part) => part.slice(name.length + 1));
}

async function sign(key: string, message: string): Promise<string> {
	const encoder = new TextEncoder();
	const cryptoKey = await crypto.subtle.importKey('raw', encoder.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
	const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
	return Array.from(new Uint8Array(signature), (b) => b.toString(16).padStart(2, '0')).join('');
}

function constantTimeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
	return diff === 0;
}

/** Worker-rendered responses miss public/_headers, so the preview sets the same headers itself. */
const SECURITY_HEADERS: Record<string, string> = {
	'Cache-Control': 'no-store',
	'X-Robots-Tag': 'noindex, nofollow',
	'Content-Security-Policy': "frame-ancestors 'self'; base-uri 'self'; object-src 'none'; form-action 'self'",
	'X-Content-Type-Options': 'nosniff',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
};

export const onRequest = defineMiddleware(async (context, next) => {
	const { pathname } = context.url;
	if (!/^\/preview(\/|$)/.test(pathname)) return next();

	const token = readToken();
	if (!token) return new Response('The preview is not set up on this server.', { status: 500, headers: SECURITY_HEADERS });

	if (pathname === '/preview/enable' || pathname === '/preview/disable') {
		const response = await next();
		for (const [name, value] of Object.entries(SECURITY_HEADERS)) response.headers.set(name, value);
		return response;
	}

	const values = cookieValues(context.request.headers.get('cookie'), PREVIEW_COOKIE);
	let allowed = false;
	for (const value of values) if (await previewCookieValid(token, value)) allowed = true;
	if (!allowed) {
		// A page opened directly (a shared link, a lapsed pass) goes through the Studio's login, which then
		// opens the preview of that page. Inside the Studio's own preview frame a plain refusal is safer
		// than a Studio inside a Studio.
		const framed = context.request.headers.get('sec-fetch-dest') === 'iframe';
		const wanted = pathname.replace(/^\/preview/, '') || '/';
		if (framed) return new Response('The preview opens from the Studio at /backend.', { status: 401, headers: SECURITY_HEADERS });
		return new Response(null, { status: 302, headers: { ...SECURITY_HEADERS, Location: `/backend/presentation?preview=${encodeURIComponent(wanted)}` } });
	}

	context.locals.preview = true;
	context.locals.sanity = previewClient(token);
	const response = await next();
	for (const [name, value] of Object.entries(SECURITY_HEADERS)) response.headers.set(name, value);
	return response;
});
