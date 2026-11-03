/**
 * Staging, behind a shared password (Ross, 3 Nov). Since launch the live
 * Worker answers identityperth.com only; staging builds go to their own
 * Worker (wrangler.jsonc beside this file) at
 * https://identityperth-staging.ross-o-neill.workers.dev, so a staging deploy
 * can never replace the live site. Every request, static files included
 * (run_worker_first), comes through here; with the right Basic credentials
 * it is served from the build's static files. The username is "identity",
 * the password the STAGING_PASSWORD secret
 * (`npx wrangler secret put STAGING_PASSWORD --config staging/wrangler.jsonc`).
 * Staging is static only: the Studio and the draft preview live on the
 * production site.
 */
const USER = 'identity';

/** Compares in constant time, so the response time says nothing about how close a guess was. */
const same = (a, b) => {
	const x = new TextEncoder().encode(a);
	const y = new TextEncoder().encode(b);
	let diff = x.length ^ y.length;
	for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
	return diff === 0;
};

export default {
	async fetch(request, env) {
		const password = env.STAGING_PASSWORD ?? '';
		const given = request.headers.get('Authorization') ?? '';
		if (!password || !same(given, `Basic ${btoa(`${USER}:${password}`)}`)) {
			return new Response('Staging needs a password.', {
				status: 401,
				headers: {
					'WWW-Authenticate': 'Basic realm="Identity staging", charset="UTF-8"',
					'Cache-Control': 'no-store',
					'X-Robots-Tag': 'noindex, nofollow',
				},
			});
		}
		const response = await env.ASSETS.fetch(request);
		const out = new Response(response.body, response);
		out.headers.set('X-Robots-Tag', 'noindex, nofollow');
		out.headers.set('Cache-Control', 'private, no-store');
		return out;
	},
};
