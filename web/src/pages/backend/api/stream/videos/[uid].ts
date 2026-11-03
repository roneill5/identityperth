import type { APIRoute } from 'astro';
import { guarded, json, stream, summarise, UID } from '../../../../../lib/stream-admin';

/**
 * GET: one video's state, polled while Stream processes an upload.
 * POST: the video is ready; ask Stream for its MP4 file, which covers play
 * (lib/video.ts), then answer with the state.
 */
export const prerender = false;

const id = (value: string | undefined) => (value && UID.test(value) ? value : null);

export const GET: APIRoute = ({ request, params }) =>
	guarded(request, async () => {
		const uid = id(params.uid);
		if (!uid) return json({ error: 'Not a Stream video ID' }, 400);
		return json(summarise(await stream(`/${uid}`)));
	});

export const POST: APIRoute = ({ request, params }) =>
	guarded(request, async () => {
		const uid = id(params.uid);
		if (!uid) return json({ error: 'Not a Stream video ID' }, 400);
		await stream(`/${uid}/downloads`, { method: 'POST' });
		return json(summarise(await stream(`/${uid}`)));
	});
