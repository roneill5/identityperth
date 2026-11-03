import { createClient } from '@sanity/client';

export const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID as string;
export const dataset = import.meta.env.PUBLIC_SANITY_DATASET as string;
// Pin the API version to the date the project started. Bump deliberately.
export const apiVersion = '2026-10-16';

if (!projectId || !dataset) {
	throw new Error('Missing PUBLIC_SANITY_PROJECT_ID or PUBLIC_SANITY_DATASET in web/.env');
}

/**
 * Build-time client. The site is fully static, so every fetch happens inside
 * `astro build`; the CDN is skipped so each build sees the latest published
 * content.
 */
export const client = createClient({
	projectId,
	dataset,
	apiVersion,
	useCdn: false,
	perspective: 'published',
});

/** Fields never stega-encoded in the preview. */
const EXACT_FIELDS = new Set(['kind', 'streamId', 'style', 'listItem']);

/**
 * Request-time client for the editors' preview (/preview): reads drafts
 * with a Viewer token, skips the CDN, and stega-encodes strings so the
 * Studio's Presentation tool can map what is on screen back to its field.
 */
export function previewClient(token: string) {
	return createClient({
		projectId,
		dataset,
		apiVersion,
		useCdn: false,
		token,
		perspective: 'drafts',
		stega: {
			enabled: true,
			studioUrl: '/backend',
			// Values the site compares or builds addresses from stay exact: the invisible edit markers would
			// break them (a video's kind stopped matching 'video', so the preview drew no videos; Ross, 3 Nov).
			filter: (props) => (EXACT_FIELDS.has(String(props.sourcePath.at(-1))) ? false : props.filterDefault(props)),
		},
	});
}
