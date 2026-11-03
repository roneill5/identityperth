import { gsap, ScrollTrigger, reducedMotion } from './motion';
import { arriveSettled, resumeVideoAt, carryVideo, adoptVideo, carrying } from './page';

/**
 * Page transitions beyond the plain fade.
 *
 * Leaving home: the page as it stands slides up off the top while the next
 * page rises into place from below, the swap already done beneath it. Reads
 * as one scroll from the hero to the work; nothing fades and nothing
 * animates in after.
 *
 * Flip: clicking a project tile (`a[data-flip]`) pins a copy of its cover
 * where it was, fades the old page, then grows the copy into the new page's
 * hero (`[data-flip-target]`) while the rest of the page fades in. Leaving a
 * project for the Projects page (nav link or the back button) runs it in
 * reverse: the hero shrinks back into its tile. A playing video cover is
 * not copied but carried: the <video> itself (an MP4 file, which keeps
 * playing through a move; a stream would reset) rides inside the copy and
 * steps into the new page's box once the copy sits over it (page.ts
 * carryVideo and adoptVideo), so nothing restarts or jumps (Ross, 29 Oct).
 * A cover that is not playing yet, or not an MP4, falls back to a frozen
 * frame that flies, with the new page's video resuming from that moment
 * underneath (resumeVideoAt).
 */

const CONTAINER = '#page';

/**
 * Resolves once the page's pictures on screen have decoded, or after `cap` ms.
 * A page that fades in while its pictures are still decoding shows their
 * blurred placeholders for a few frames, which reads as a glitch when the
 * page was on screen seconds ago (Ross, 3 Nov); a short wait costs nothing
 * when they are cached and is capped when they are not.
 */
export function decoded(cap = 350): Promise<void> {
	const height = window.innerHeight;
	const waits = Array.from(document.querySelectorAll<HTMLImageElement>(`${CONTAINER} img`))
		.filter((img) => {
			const r = img.getBoundingClientRect();
			return r.bottom > -height && r.top < height * 2 && img.currentSrc;
		})
		.map((img) => img.decode().catch(() => {}));
	if (!waits.length) return Promise.resolve();
	return Promise.race([Promise.all(waits).then(() => {}), new Promise<void>((r) => window.setTimeout(r, cap))]);
}

// ---------- leaving home ----------

let leaving: HTMLElement | null = null;

/**
 * Leaving the home page: the whole page as it stands, hero and ticker, is
 * lifted into a fixed layer over everything, the next page is swapped in
 * underneath, and the layer then slides up off the top while the new page
 * rises into place from below, in one movement: a scroll from the hero to
 * the work. Nothing waits mid-way, since the swap is done before anything
 * moves. The hero plays from its MP4 file, which keeps playing through the
 * move (a stream would reset: then its frame is frozen onto a canvas for the
 * ride instead), so the showreel runs on until it is off the top (Ross,
 * 29 Oct).
 */
export async function slideOut(fallback: () => Promise<void>) {
	const page = document.getElementById('page');
	const ticker = document.getElementById('ticker');
	if (!page || reducedMotion()) return fallback();
	// The new page's first screen arrives as it is: no entrance reveals.
	arriveSettled();
	const video = Array.from(page.querySelectorAll<HTMLVideoElement>('[data-hero] video')).find((v) => v.getClientRects().length > 0) ?? null;
	const frame = video?.dataset.mp4 ? null : freeze(video);
	if (frame && video) {
		frame.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover';
		video.parentElement?.appendChild(frame);
	}
	// Moving a node restarts its CSS animations: the marquee's position is read first and put back after.
	const track = ticker?.querySelector<HTMLElement>('.ticker-track');
	const phase = track?.getAnimations()[0]?.currentTime ?? null;
	const layer = document.createElement('div');
	layer.className = 'leave';
	// Empty stand-ins keep the ids, so the swap has something to replace; nothing inside the layer answers an id lookup.
	for (const el of [page, ticker]) {
		if (!el) continue;
		const stand = document.createElement(el.tagName.toLowerCase());
		stand.id = el.id;
		el.removeAttribute('id');
		el.querySelectorAll('[id]').forEach((inner) => inner.removeAttribute('id'));
		el.replaceWith(stand);
		layer.appendChild(el);
	}
	document.body.appendChild(layer);
	const restarted = track?.getAnimations()[0];
	if (restarted && phase != null) restarted.currentTime = phase;
	// Phones collapse their address bar as the finger moves, which changes 100dvh mid-slide: the leaving
	// page is pinned to the size it had, so neither the hero nor the ticker resizes on the way out.
	const height = window.innerHeight;
	layer.style.height = `${height}px`;
	page.querySelectorAll<HTMLElement>('[data-hero]').forEach((hero) => (hero.style.height = `${height}px`));
	const screen = ticker?.querySelector<HTMLElement>('[data-ticker-screen]');
	if (screen) screen.style.top = `${height - screen.querySelector<HTMLElement>('.ticker-track')!.offsetHeight}px`;
	leaving = layer;
}

/** The new page is in place beneath the layer: the old page slides off the top as the new one rises into place. */
export async function slideIn(fallback: () => Promise<void>) {
	const layer = leaving;
	leaving = null;
	if (!layer) return fallback();
	const height = window.innerHeight;
	// The site chrome (header or sidebar, bottom bar) sits outside the page, so the layer would
	// uncover it as it passes: the lime ID popping out from behind the lime ticker (Ross, 30 Oct).
	// It rides in with the new page instead, starting a screen lower, so the header follows the
	// ticker up the way the next page of a scroll would.
	const chrome = Array.from(document.querySelectorAll<HTMLElement>('[data-sidebar], [data-bottom-bar]'));
	gsap.set(chrome, { y: height });
	await gsap
		.timeline()
		.to(layer, { y: -height, duration: 0.8, ease: 'power3.inOut' }, 0)
		.to([...gsap.utils.toArray<HTMLElement>(CONTAINER), ...chrome], { y: 0, duration: 0.8, ease: 'power3.inOut', clearProps: 'transform' }, 0);
	layer.remove();
	// Scroll positions were measured while the page sat a screen lower.
	ScrollTrigger.refresh();
}

// ---------- flip ----------

interface Pending {
	src: string;
	position: string;
	rect: DOMRect;
	/** The hover zoom on the cover at click time, so the copy starts identical. */
	zoom: number;
	/** A playing video cover: its frame at the click, and where it was up to. */
	frame: HTMLCanvasElement | null;
	time: number;
	/** The playing cover itself, when it can ride along (an MP4). */
	video: HTMLVideoElement | null;
}

const canCarry = (video: HTMLVideoElement | null): video is HTMLVideoElement =>
	Boolean(video && video.dataset.mp4 && !video.paused && video.classList.contains('is-playing'));

/** The video's current frame on a canvas, or null when it cannot be read. */
function freeze(video: HTMLVideoElement | null): HTMLCanvasElement | null {
	if (!video || video.paused || !video.videoWidth || !video.classList.contains('is-playing')) return null;
	try {
		const canvas = document.createElement('canvas');
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		canvas.getContext('2d')!.drawImage(video, 0, 0);
		return canvas;
	} catch {
		return null;
	}
}

let pending: Pending | null = null;
let clone: HTMLElement | null = null;

/** Remember the cover of any `a[data-flip]` that is about to be followed. */
export function armFlips() {
	document.addEventListener(
		'click',
		(e) => {
			pending = null;
			if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
			const link = (e.target as HTMLElement | null)?.closest<HTMLAnchorElement>('a[data-flip]');
			const img = link?.querySelector<HTMLImageElement>('img');
			if (!link || !img?.currentSrc || !img.complete) return;
			// The cover's own box, not the zoomed image inside it: the copy must
			// never be larger than the hero it is heading for.
			const box = link.querySelector<HTMLElement>('[data-flip-box]') ?? link;
			const matrix = getComputedStyle(img).transform.match(/matrix\(([^,]+),/);
			const video = link.querySelector<HTMLVideoElement>('video[data-hls]');
			pending = {
				src: img.currentSrc,
				position: getComputedStyle(img).objectPosition,
				rect: box.getBoundingClientRect(),
				zoom: matrix ? parseFloat(matrix[1]) || 1 : 1,
				frame: canCarry(video) ? null : freeze(video),
				time: video?.currentTime ?? 0,
				video: canCarry(video) ? video : null,
			};
		},
		true,
	);
}

export async function flipOut(fallback: () => Promise<void>) {
	const p = pending;
	pending = null;
	if (!p || reducedMotion()) return fallback();
	clone = document.createElement('div');
	clone.className = 'flip';
	clone.style.cssText = `left:${p.rect.left}px;top:${p.rect.top}px;width:${p.rect.width}px;height:${p.rect.height}px`;
	const img = new Image();
	// The copy starts as the tile's own picture, already on screen. The hero-sized one replaces it once it
	// has decoded in full: swapped in earlier, its progressive scans painted as a blocky band mid-flip.
	img.src = p.src;
	img.alt = '';
	img.style.objectPosition = p.position;
	img.style.transform = `scale(${p.zoom})`;
	clone.appendChild(img);
	const big = new Image();
	big.src = p.src.replace(/([?&]w=)\d+/, '$11440');
	void big.decode().then(() => img.isConnected && (img.src = big.src)).catch(() => {});
	if (p.frame) {
		p.frame.style.transform = `scale(${p.zoom})`;
		clone.appendChild(p.frame);
	}
	resumeAt = p.frame ? p.time : null;
	document.body.appendChild(clone);
	if (p.video) {
		p.video.style.transform = `scale(${p.zoom})`;
		carryVideo(p.video, clone, '[data-flip-target]');
	}
	await gsap.to(CONTAINER, { opacity: 0, duration: 0.3, ease: 'power1.inOut' });
}

/** Where the frozen video was up to, for the next page to resume from. */
let resumeAt: number | null = null;

export async function flipIn(fallback: () => Promise<void>) {
	const c = clone;
	clone = null;
	const target = document.querySelector<HTMLElement>('[data-flip-target]');
	const time = resumeAt;
	resumeAt = null;
	if (!c || !target) {
		adoptVideo();
		c?.remove();
		return fallback();
	}
	gsap.set(CONTAINER, { opacity: 0 });
	const r = target.getBoundingClientRect();
	const copies = c.querySelectorAll('img, canvas, video');
	// The hero's own cover stays out of sight while the copy grows over it: the page fades in from
	// 0.4 s, and the cover would otherwise show round the copy's edges, a second image under the one
	// still moving (Ross, 3 Nov). A video cover would also show a different moment of the same video.
	target.style.visibility = 'hidden';
	// The hero's video starts picking up from the frozen moment as the frame flies.
	const resumed = time == null ? Promise.resolve() : resumeVideoAt('[data-flip-target]', time);
	const grow = gsap
		.timeline()
		.to(c, { left: r.left, top: r.top, width: r.width, height: r.height, duration: 0.9, ease: 'expo.inOut' }, 0)
		.to(copies, { scale: 1, duration: 0.9, ease: 'expo.inOut' }, 0);
	// The page fades in from 0.4 s, or a touch later if its pictures are still decoding.
	await Promise.all([decoded(500), new Promise((resolve) => window.setTimeout(resolve, 400))]);
	await Promise.all([grow, gsap.to(CONTAINER, { opacity: 1, duration: 0.5, ease: 'power1.inOut', clearProps: 'all' })]);
	// The copy sits exactly over the hero: a carried cover steps across into it, frame for frame,
	// and the copy (now only its poster) goes at once rather than fading over the live video.
	const handedOver = adoptVideo();
	await resumed;
	target.style.visibility = '';
	if (handedOver) {
		c.remove();
		return;
	}

	// Hold the copy until the hero underneath has pixels, so nothing flashes.
	const hero = target.querySelector<HTMLImageElement>('img');
	await new Promise<void>((resolve) => {
		if (!hero || (hero.complete && hero.naturalWidth > 0)) return resolve();
		const done = () => resolve();
		hero.addEventListener('load', done, { once: true });
		hero.addEventListener('error', done, { once: true });
		window.setTimeout(done, 1500);
	});
	await gsap.to(c, { opacity: 0, duration: 0.3, ease: 'power1.inOut' });
	c.remove();
}

// ---------- reverse flip ----------

let returning: { clone: HTMLElement; slug: string; time: number | null } | null = null;

/** Leaving a project page for the list: pin the hero where it is. */
export async function unflipOut(fallback: () => Promise<void>) {
	const target = document.querySelector<HTMLElement>('[data-flip-target]');
	const img = target?.querySelector<HTMLImageElement>('img');
	const rect = target?.getBoundingClientRect();
	// Only worth it when the hero is still on screen.
	if (!target || !img?.currentSrc || !rect || rect.bottom <= 0 || reducedMotion()) return fallback();
	// The URL has already changed to the list by now; the hero knows its slug.
	const slug = target.dataset.slug ?? '';
	const clone = document.createElement('div');
	clone.className = 'flip';
	clone.style.cssText = `left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px`;
	const copy = new Image();
	copy.src = img.currentSrc;
	copy.alt = '';
	copy.style.objectPosition = getComputedStyle(img).objectPosition;
	clone.appendChild(copy);
	const video = target.querySelector<HTMLVideoElement>('video[data-hls]');
	const frame = canCarry(video) ? null : freeze(video);
	if (frame) clone.appendChild(frame);
	document.body.appendChild(clone);
	if (canCarry(video)) carryVideo(video, clone, `a[data-flip][href="/projects/${slug}"]`);
	returning = { clone, slug, time: frame ? (video?.currentTime ?? 0) : null };
	// The list's first screen appears as it is, so the landing tile is there to land on.
	arriveSettled();
	await gsap.to(CONTAINER, { opacity: 0, duration: 0.25, ease: 'power1.inOut' });
}

/** On the list: shrink the pinned hero into the tile it came from. */
export async function unflipIn(fallback: () => Promise<void>) {
	const r = returning;
	returning = null;
	const tile = r ? document.querySelector<HTMLElement>(`a[data-flip][href="/projects/${r.slug}"]`) : null;
	if (!r || !tile) {
		adoptVideo();
		r?.clone.remove();
		return fallback();
	}
	gsap.set(CONTAINER, { opacity: 0 });
	const cover = tile.querySelector<HTMLElement>('[data-flip-box]') ?? tile;
	// The tile's own cover stays out of sight while the copy shrinks onto it: the page fades in from
	// 0.25 s, and the cover showed through under the still-moving copy, then the copy vanished with a
	// jump (Ross, 3 Nov). The caption beside it fades in with the page as before.
	cover.style.visibility = 'hidden';
	// Bring the tile into view first if it is below the fold.
	let box = cover.getBoundingClientRect();
	if (box.bottom > window.innerHeight || box.top < 0) {
		window.scrollTo(0, window.scrollY + box.top - Math.max(0, (window.innerHeight - box.height) / 2));
		box = cover.getBoundingClientRect();
	}
	const resumed = r.time == null ? Promise.resolve() : resumeVideoAt(`a[data-flip][href="/projects/${r.slug}"]`, r.time);
	const shrink = gsap.to(r.clone, { left: box.left, top: box.top, width: box.width, height: box.height, duration: 0.7, ease: 'expo.inOut' });
	// The list fades in from 0.25 s, or a touch later if its pictures are still decoding.
	await Promise.all([decoded(500), new Promise((resolve) => window.setTimeout(resolve, 250))]);
	await Promise.all([shrink, gsap.to(CONTAINER, { opacity: 1, duration: 0.4, ease: 'power1.inOut', clearProps: 'all' })]);
	const handedOver = adoptVideo();
	await resumed;
	cover.style.visibility = '';
	// A carried video is now in the tile and the copy holds only its poster: it goes at once. An image copy
	// fades over the tile's own picture, which is the same picture at the same size, so nothing jumps.
	if (!handedOver) await gsap.to(r.clone, { opacity: 0, duration: 0.25, ease: 'power1.inOut' });
	r.clone.remove();
}
