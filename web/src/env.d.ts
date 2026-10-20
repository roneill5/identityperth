/// <reference types="astro/client" />
/// <reference path="../worker-configuration.d.ts" />

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
}
