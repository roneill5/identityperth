/**
 * Cloudflare Worker in front of the static site. It only runs for /backend
 * (see run_worker_first in wrangler.jsonc). The Sanity Studio there is a
 * single-page app, so any path under /backend that is not a real file gets
 * the Studio's index page and the Studio's own router takes it from there.
 */
interface Env {
	ASSETS: { fetch(request: Request): Promise<Response> };
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const response = await env.ASSETS.fetch(request);
		if (response.status !== 404) return response;
		const url = new URL(request.url);
		const inStudio = url.pathname === '/backend' || url.pathname.startsWith('/backend/');
		// Routes have no extension; a missing file (a stale chunk, say) should still 404.
		const looksLikeRoute = !/\.[a-z0-9]+$/i.test(url.pathname);
		if (inStudio && looksLikeRoute) {
			return env.ASSETS.fetch(new Request(new URL('/backend/', url), request));
		}
		return response;
	},
};
