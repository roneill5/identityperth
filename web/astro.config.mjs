// @ts-check
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://identityperth.com',
	// Static by default: every public page is prerendered at build time from
	// published Sanity content and served as a file. The Cloudflare adapter
	// is only there for the few routes that opt out of prerendering: the
	// Studio's deep links under /backend and the editors' draft preview
	// under /preview.
	output: 'static',
	// No Astro sessions: stops the Cloudflare adapter adding a SESSION KV binding
	// (which would need a KV namespace before `wrangler deploy` works).
	session: false,
	adapter: cloudflare({
		imageService: 'passthrough',
	}),
	vite: {
		plugins: [tailwindcss()],
	},
});
