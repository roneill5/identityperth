// @ts-check
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

/** SITE_URL from the shell or the Builds variables; the config file has no Node types, hence the cast. */
const siteUrl = /** @type {string | undefined} */ (/** @type {any} */ (globalThis).process?.env?.SITE_URL);

// https://astro.build/config
export default defineConfig({
	// Canonical and share-image URLs are absolute, so a staging deploy can set
	// SITE_URL to its own address (the Builds variable or the shell) and shares
	// from there resolve. Unset, it is the production domain.
	site: siteUrl ?? 'https://identityperth.com',
	// Static by default: every public page is prerendered at build time from
	// published Sanity content and served as a file. The Cloudflare adapter
	// is only there for the few routes that opt out of prerendering: the
	// Studio's deep links under /backend and the editors' draft preview
	// under /preview.
	output: 'static',
	// No Astro sessions: stops the Cloudflare adapter adding a SESSION KV binding
	// (which would need a KV namespace before `wrangler deploy` works).
	session: false,
	// Images: Sanity's CDN does the hotspot crop, then Astro fetches each file
	// at build time and writes the srcset widths into dist as WebP, so the site
	// serves its own images from Cloudflare's edge. `compile` keeps that to the
	// prerendered pages; the on-demand preview passes the CDN URLs through.
	image: {
		domains: ['cdn.sanity.io'],
	},
	adapter: cloudflare({
		imageService: 'compile',
	}),
	// sitemap-index.xml for search engines (robots.txt points at it on production); the Worker routes are not in it.
	integrations: [sitemap({ filter: (page) => !/\/(preview|backend|404)(\/|$)/.test(page) })],
	// Links fetch as they scroll into view, so the next page is usually here when clicked.
	prefetch: {
		prefetchAll: true,
		defaultStrategy: 'viewport',
	},
	vite: {
		plugins: [tailwindcss()],
		resolve: {
			// The preview overlays' package imports @sanity/ui's stylesheet, and Astro links
			// every stylesheet in a page's script graph from the page's head: on every public
			// page, render-blocking (2 Nov). The import resolves to an empty file instead, and
			// PreviewEditing.astro loads the real stylesheet itself, on preview pages only.
			alias: [{ find: /^@sanity\/ui\/styles\.css$/, replacement: decodeURIComponent(new URL('./src/styles/empty.css', import.meta.url).pathname) }],
		},
	},
});
