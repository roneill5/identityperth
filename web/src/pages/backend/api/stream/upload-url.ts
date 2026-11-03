import type { APIRoute } from 'astro';
import { guarded, json, stream } from '../../../../lib/stream-admin';

/**
 * POST {name}: a one-time Stream upload URL and the new video's ID. The
 * browser posts the file to that URL itself (Stream's basic direct upload,
 * up to 200 MB); the ID is saved in the field at once and the video plays
 * once Stream has processed it.
 */
export const prerender = false;

export const POST: APIRoute = ({ request }) =>
	guarded(request, async () => {
		const body = (await request.json().catch(() => ({}))) as { name?: unknown };
		const name = String(body.name ?? '').replace(/\s+/g, ' ').trim().slice(0, 120) || 'Upload from the Studio';
		const result = await stream('/direct_upload', {
			method: 'POST',
			body: JSON.stringify({
				maxDurationSeconds: 3600,
				requireSignedURLs: false,
				// The site shows the first frame as the poster; Stream's own thumbnail matches it.
				thumbnailTimestampPct: 0,
				meta: { name, uploadedFrom: 'identityperth.com/backend' },
			}),
		});
		return json({ uploadURL: result.uploadURL, uid: result.uid });
	});
