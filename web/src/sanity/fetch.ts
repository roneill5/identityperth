import type { ClientReturn, QueryParams, SanityClient } from '@sanity/client';
import { client } from './client';
import { PROJECT_PAGES_QUERY, PROJECT_QUERY, SETTINGS_QUERY } from './queries';

/**
 * Where every page gets its content. Each client keeps the answers it has
 * already asked for, so a query (with its parameters) goes to Sanity once
 * however many pages and components use it:
 *
 *   - the build client lives for the whole build, so the settings and the
 *     project list are fetched once, not once per page (the 24 project pages
 *     each asked for the whole list; a build now makes about ten requests
 *     where it made about sixty);
 *   - the editors' preview makes a new client for every request
 *     (middleware.ts), so its answers last one page view and drafts are
 *     always fresh.
 */
const answers = new WeakMap<SanityClient, Map<string, Promise<unknown>>>();

export function load<const Q extends string>(sanity: SanityClient, query: Q, params?: QueryParams): Promise<ClientReturn<Q>> {
	let asked = answers.get(sanity);
	if (!asked) answers.set(sanity, (asked = new Map()));
	const key = params ? `${query}\n${JSON.stringify(params)}` : query;
	let answer = asked.get(key) as Promise<ClientReturn<Q>> | undefined;
	if (!answer) {
		answer = sanity.fetch(query, params ?? {}) as Promise<ClientReturn<Q>>;
		// A failed request is not remembered: the next caller asks again.
		answer.catch(() => asked.delete(key));
		asked.set(key, answer);
	}
	return answer;
}

/** Site settings: the menu, contact details and search defaults on every page. */
export function getSettings(sanity: SanityClient = client) {
	return load(sanity, SETTINGS_QUERY);
}

/**
 * One project page. The build reads every project page in one request and
 * picks from it; the preview asks for the one being viewed, which is a
 * twentieth of the size.
 */
export async function getProject(sanity: SanityClient, slug: string) {
	if (sanity !== client) return load(sanity, PROJECT_QUERY, { slug });
	return (await load(client, PROJECT_PAGES_QUERY)).find((project) => project.slug === slug) ?? null;
}
