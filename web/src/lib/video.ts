import { stegaClean } from '@sanity/client/stega';

/**
 * Helpers for the `video` object from Sanity. Every video lives on Cloudflare
 * Stream and plays as a silent loop; Sanity only holds the ID. The site plays
 * Stream's HLS in a plain <video>
 * (scripts/page.ts), with Stream's own still of the video as the poster, so
 * there is no player iframe to load (29 Oct).
 */

export interface VideoData {
	streamId?: string | null;
}

/** The account's Stream delivery host (public; it is in every playback URL). */
export const STREAM_HOST = 'https://customer-16n3ytiw02tgly9e.cloudflarestream.com';

/** The checked ID, or null. stegaClean: preview strings carry invisible edit markers that would break it. */
function streamId(video?: VideoData | null): string | null {
	const id = stegaClean(video?.streamId ?? '');
	return /^[a-f0-9]{32}$/i.test(id) ? id : null;
}

/** The HLS manifest, adaptive bitrate, which every browser can play (Safari natively, the rest through hls.js). */
export function hlsUrl(video?: VideoData | null): string | null {
	const id = streamId(video);
	return id ? `${STREAM_HOST}/${id}/manifest/video.m3u8` : null;
}

/** The video's first frame, at a width, for the poster behind it: the same frame the video opens on, so nothing flashes when it starts. */
export function posterUrl(video: VideoData, width: number): string {
	return `${STREAM_HOST}/${streamId(video)}/thumbnails/thumbnail.jpg?time=0s&width=${width}`;
}

/** The whole video as one MP4 file, which Stream makes on request (stream-videos.mjs asks for it). Covers play this: a file keeps playing when the flip carries it across pages, a stream does not. */
export function mp4Url(video: VideoData): string {
	return `${STREAM_HOST}/${streamId(video)}/downloads/default.mp4`;
}

export function hasVideo(video?: VideoData | null): video is VideoData {
	return Boolean(streamId(video));
}
