// @ts-check
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://identityperth.com',
	// Fully static: every page is prerendered at build time from published
	// Sanity content and served as files from Cloudflare Workers static assets.
	output: 'static',
	vite: {
		plugins: [tailwindcss()],
	},
});
