/// <reference types="astro/client" />
/// <reference path="../worker-configuration.d.ts" />

/** The light build has no declaration file of its own; it is the same API minus subtitles and alternate audio. */
declare module 'hls.js/light' {
	export * from 'hls.js';
	export { default } from 'hls.js';
}

declare namespace App {
	interface Locals {
		/** Set by the middleware on /preview routes: a drafts client with stega on. */
		sanity?: import('@sanity/client').SanityClient;
		preview?: boolean;
	}
}

interface ImportMetaEnv {
	readonly PUBLIC_SANITY_PROJECT_ID: string;
	readonly PUBLIC_SANITY_DATASET: string;
	/** "true" loads Cloudflare Zaraz, which sends GA4 from the edge. Takes precedence over PUBLIC_GA_ID. */
	readonly PUBLIC_ZARAZ?: string;
	/** The GA4 Measurement ID (G-XXXXXXXXXX) for Google's own tag, when Zaraz is not used. */
	readonly PUBLIC_GA_ID?: string;
	/** The Microsoft Clarity project ID. Unset: no recordings. */
	readonly PUBLIC_CLARITY_ID?: string;
}
