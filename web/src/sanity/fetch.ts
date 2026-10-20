import type { SanityClient } from '@sanity/client';
import { client } from './client';
import { SETTINGS_QUERY } from './queries';

const cache = new WeakMap<SanityClient, ReturnType<typeof fetchSettings>>();

function fetchSettings(sanity: SanityClient) {
	return sanity.fetch(SETTINGS_QUERY);
}

/** Site settings are needed by every page, so fetch them once per client (once per build, or once per preview request). */
export function getSettings(sanity: SanityClient = client) {
	let promise = cache.get(sanity);
	if (!promise) {
		promise = fetchSettings(sanity);
		cache.set(sanity, promise);
	}
	return promise;
}
