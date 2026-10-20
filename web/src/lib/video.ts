import { stegaClean } from '@sanity/client/stega';

/**
 * Helpers for the `video` object from Sanity. Every video lives on Cloudflare
 * Stream; Sanity only holds the ID and whether it loops silently or plays
 * as a player with sound.
 */

export type VideoPlayback = 'loop' | 'player';

export interface VideoData {
	streamId?: string | null;
	playback?: VideoPlayback | null;
}

/** The Stream player URL, in background mode for loops. */
export function embedUrl(video?: VideoData | null): string | null {
	if (!video?.streamId) return null;
	const params = video.playback === 'player' ? 'preload=metadata' : 'autoplay=true&muted=true&loop=true&controls=false&preload=auto';
	// stegaClean: preview strings carry invisible edit markers that would break the ID.
	return `https://iframe.videodelivery.net/${stegaClean(video.streamId)}?${params}`;
}

export function hasVideo(video?: VideoData | null): video is VideoData {
	return Boolean(video?.streamId);
}
