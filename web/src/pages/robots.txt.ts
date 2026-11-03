import type { APIRoute } from 'astro';

/**
 * Only the production domain may be indexed. A build whose site URL is
 * anything else (the workers.dev staging address, a preview) asks crawlers to
 * stay away, and Base.astro adds the matching noindex tag on every page.
 */
export const GET: APIRoute = ({ site }) => {
	const production = /^(www\.)?identityperth\.com$/.test(site?.hostname ?? '');
	const body = production
		? ['User-agent: *', 'Allow: /', 'Disallow: /preview', 'Disallow: /backend', '', `Sitemap: ${site!.origin}/sitemap-index.xml`, ''].join('\n')
		: ['User-agent: *', 'Disallow: /', ''].join('\n');
	return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
