import { gsap, ScrollTrigger, EASE, reducedMotion } from './motion';
import { initSplash } from './splash';
import { initCycle } from './cycle';
import { initStudio } from './studio';
import { initAccordion } from './accordion';
import { initPong } from './pong';

/**
 * Per-page behaviour. Everything created here is torn down in `destroyPage`
 * before the router swaps the page, then set up again for the new one.
 *
 * Hooks (add the attribute in markup, no JS needed per component):
 *   data-reveal            fade and rise into view once, when scrolled to
 *   data-reveal-group      stagger the direct children instead
 *   data-parallax="0.15"   drift vertically at a fraction of scroll speed
 *   data-hls               (on <video>) Stream HLS attached when near and displayed; data-loop plays while on screen
 *   data-warm-sizes        (on a tile) hovering fetches the hero-sized candidate of its picture
 *   data-warm-idle         hidden pictures of the next page, fetched once this page is idle
 *   data-splash            scroll or swipe commits the move to Projects
 *   data-accordion         animated <details> inside, one open at a time
 *   data-cycle             a heading that cycles through its [data-phrase] children
 *   data-studio            the Studio page: photo column and accordion in step
 *   data-pong              (on <canvas>) Pong against the computer, on the 404 page
 */

let ctx: gsap.Context | null = null;
const cleanups: Array<() => void> = [];
let settled = false;

/** This page's videos: who has a source, their hls.js players and the on-screen observer. Reset per page. */
interface VideoManager {
	videos: HTMLVideoElement[];
	attached: WeakSet<HTMLVideoElement>;
	players: Map<HTMLVideoElement, { destroy(): void }>;
	onScreen: IntersectionObserver;
	run(video: HTMLVideoElement): void;
}
let vm: VideoManager | null = null;
const isLoop = (video: HTMLVideoElement) => video.hasAttribute('data-loop');

// A play attempt that is refused (nothing buffered yet, or a page swapped in by the client
// router, where Chrome ignores the muted attribute) is tried again once the stream can play.
function play(video: HTMLVideoElement) {
	if (!isLoop(video)) return;
	video.muted = true;
	video.defaultMuted = true;
	video.playsInline = true;
	video.play().catch(() => video.addEventListener('canplay', () => void video.play().catch(() => {}), { once: true }));
}

const DESKTOP = '(min-width: 64rem)';

/** Chrome on Android reports its bandwidth estimate; under 2 Mbps a showreel starts a step softer (iOS reports nothing). */
const slowConnection = () => ((navigator as Navigator & { connection?: { downlink?: number } }).connection?.downlink || Infinity) < 2;

/**
 * The rendition a stream starts on: the sharpest the box can show, and for an adaptive showreel no sharper
 * than 480p (360p on a slow connection), so the first frames arrive at once (720p took twice as long) and
 * it steps up from there. `levels` are in hls.js order, lowest bitrate first. Home.astro's inline script
 * makes the same choice ahead of this: keep the two together.
 */
function startLevel(levels: Array<{ width: number; height: number }>, video: HTMLVideoElement, adaptive: boolean) {
	const limit = Math.max(video.clientWidth, video.clientHeight) * (window.devicePixelRatio || 1);
	const fit = levels.map((l, i) => ({ i, size: Math.max(l.width, l.height) })).filter((l) => l.size <= limit * 1.2);
	const start = adaptive ? fit.filter((l) => l.size <= (slowConnection() ? 640 : 854)) : fit;
	return start.length ? start[start.length - 1].i : fit.length ? fit[0].i : levels.length - 1;
}

/** The showreel's stream fetched ahead, by its URL: its player waits for this, then reads it all from cache. */
const warming = new Map<string, Promise<unknown>>();

declare global {
	interface Window {
		/** Set by the inline script in Home.astro: the showreel's HLS URL and the fetch of its first seconds. */
		__reel?: { src: string; ready: Promise<unknown> };
	}
}

/**
 * On phones and tablets the showreel streams, and the page only sets its videos up once everything on it has
 * loaded (1.7 s in on a 2.5 Mbps phone). Home.astro's inline script starts fetching the playlists and the
 * first 4 s while the page is still parsing; this notes that fetch, and fetches the player alongside it, so
 * `attach` waits for both and the player's own requests are answered from cache (4 Nov).
 */
export function warmShowreel() {
	const reel = window.__reel;
	if (!reel) return;
	warming.set(reel.src, Promise.all([reel.ready, import('hls.js/light')]).catch(() => {}));
}

/** A video transitions.ts lifted out of the leaving page, still playing, and the selector of the element it lands in. */
let carried: { video: HTMLVideoElement; host: string } | null = null;

/** Moves a playing MP4 video to a new parent; the browser keeps its playback (a stream would not survive this). */
function moveVideo(video: HTMLVideoElement, into: Element, before: Node | null = null) {
	const time = video.currentTime;
	const atomic = (into as Element & { moveBefore?: (node: Node, child: Node | null) => void }).moveBefore;
	if (atomic) atomic.call(into, video, before);
	else into.insertBefore(video, before);
	if (video.currentTime + 0.5 < time) video.currentTime = time;
	play(video);
}

/** Whether a cover is on its way to the page that is arriving. */
export const carrying = () => carried !== null;

/** transitions.ts: lift this cover out of the page into `into`; it lands in `host`'s video box on the next page. */
export function carryVideo(video: HTMLVideoElement, into: Element, host: string) {
	carried = { video, host };
	video.setAttribute('data-carried', '');
	moveVideo(video, into);
}

/** transitions.ts, once the copy sits exactly over the carried video's new home: step it across, replacing the page's own copy. */
export function adoptVideo(): boolean {
	const c = carried;
	carried = null;
	if (!c) return false;
	const box = document.querySelector<HTMLElement>(c.host)?.querySelector<HTMLElement>('[data-video]');
	const own = box?.querySelector('video');
	if (!box || !own || !vm) {
		c.video.remove();
		vm?.videos.forEach(vm.run);
		return false;
	}
	vm.players.get(own)?.destroy();
	vm.players.delete(own);
	vm.onScreen.unobserve(own);
	moveVideo(c.video, box, own);
	own.remove();
	c.video.removeAttribute('data-carried');
	c.video.style.transform = '';
	vm.videos = vm.videos.filter((v) => v !== own).concat(c.video);
	vm.attached.add(c.video);
	vm.onScreen.observe(c.video);
	return true;
}

/**
 * transitions.ts: the video inside `host` (the hero a tile opened into, or
 * the tile a hero shrank back to) picks up from `time`, where the one on the
 * last page was frozen. Resolves once it is playing there, or after a moment
 * if it cannot (the frozen frame then gives way to whatever it shows).
 */
export function resumeVideoAt(host: string, time: number): Promise<void> {
	const video = document.querySelector<HTMLElement>(host)?.querySelector<HTMLVideoElement>('video[data-hls]');
	const manager = vm;
	if (!video || !manager) return Promise.resolve();
	return new Promise((resolve) => {
		let done = false;
		const finish = () => {
			if (done) return;
			done = true;
			resolve();
		};
		const seek = () => {
			const length = video.duration;
			video.currentTime = Number.isFinite(length) && length > 0 ? time % length : time;
			video.addEventListener('playing', () => video.addEventListener('timeupdate', finish, { once: true }), { once: true });
			play(video);
		};
		if (video.readyState >= 1) seek();
		else video.addEventListener('loadedmetadata', seek, { once: true });
		manager.run(video);
		window.setTimeout(finish, 1500);
	});
}

/**
 * The next initPage treats whatever is already on screen as arrived: no
 * entrance reveals for it. Used by the slide from home, which shows the
 * new page's first screen before the page-load event fires.
 */
export function arriveSettled() {
	settled = true;
}

export function initPage(root: ParentNode = document) {
	destroyPage();
	const container = root.querySelector<HTMLElement>('#page') ?? document.body;
	// The home page on its way out (transitions.ts, .leave) is still in the document; nothing here is for it.
	const q = <T extends Element>(selector: string): T[] => Array.from(root.querySelectorAll<T>(selector)).filter((el) => !el.closest('.leave, .leave-ticker'));
	const reduce = reducedMotion();
	const skipOnScreen = settled;
	settled = false;
	// The slide from home starts the page a screen lower (transitions.ts); what will be on screen once it lands counts as on screen.
	const shift = Number(gsap.getProperty(container, 'y')) || 0;
	const onScreen = (el: Element) => el.getBoundingClientRect().top - shift < window.innerHeight;

	ctx = gsap.context(() => {
		// Reveal on scroll
		q<HTMLElement>('[data-reveal]').forEach((el) => {
			if (reduce || (skipOnScreen && onScreen(el))) return;
			gsap.from(el, {
				opacity: 0,
				y: 16,
				duration: 0.7,
				ease: EASE.out,
				scrollTrigger: { trigger: el, start: 'top 92%', once: true },
			});
		});

		// Groups reveal item by item as each one enters, so a long grid never
		// waits on a single stagger from the top.
		q<HTMLElement>('[data-reveal-group]').forEach((group) => {
			const items = (Array.from(group.children) as HTMLElement[]).filter((el) => !(skipOnScreen && onScreen(el)));
			if (reduce || !items.length) return;
			gsap.set(items, { opacity: 0, y: 16 });
			ScrollTrigger.batch(items, {
				start: 'top 94%',
				once: true,
				onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.7, ease: EASE.out, stagger: 0.06, overwrite: true }),
			});
		});

		// Parallax drift
		q<HTMLElement>('[data-parallax]').forEach((el) => {
			if (reduce) return;
			const amount = parseFloat(el.dataset.parallax || '0.12');
			gsap.fromTo(
				el,
				{ yPercent: -amount * 50 },
				{
					yPercent: amount * 50,
					ease: 'none',
					scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
				},
			);
		});
	}, container);

	// Images blur up as they arrive (the LQIP shows underneath until then)
	markImages(root);

	// Videos: Stream's HLS in a plain <video>, over its poster. A source attaches
	// once the element is displayed and within a screen of the viewport (hls.js,
	// loaded then; native HLS only where hls.js cannot run); loops play only
	// while on screen; turning a phone swaps the home hero's two cuts.
	// A cover riding in from the last page is not this page's to start: adoptVideo hands it over.
	const videos = Array.from(q<HTMLVideoElement>('video[data-hls]:not([data-carried])'));
	if (videos.length) {
		const players = new Map<HTMLVideoElement, { destroy(): void }>();
		const attached = new WeakSet<HTMLVideoElement>();
		const displayed = (el: Element) => el.getClientRects().length > 0;
		const awaitingCarry = (video: HTMLVideoElement) => Boolean(carried && video.closest(carried.host));
		const attach = async (video: HTMLVideoElement) => {
			if (attached.has(video) || awaitingCarry(video)) return;
			attached.add(video);
			video.addEventListener(isLoop(video) ? 'playing' : 'loadedmetadata', () => video.classList.add('is-playing'), { once: true });
			// A cover plays its MP4 file, so the flip can carry the element between pages. The home showreel does
			// too on desktop; on phones and tablets (data-adaptive) it streams, since one file cannot adapt to a
			// weak connection: at 2.5 Mbps the 32 MB phone cut stalled 22 times in its first half minute (3 Nov).
			const adaptive = 'adaptive' in video.dataset && !matchMedia(DESKTOP).matches;
			if (video.dataset.mp4 && !adaptive) {
				video.src = video.dataset.mp4;
				return;
			}
			const src = video.dataset.hls!;
			// The showreel's first pieces are already on their way (warmShowreel): wait for them, so the player's
			// own requests are answered from cache instead of downloading the same 4 s again.
			const ahead = warming.get(src);
			if (ahead) await Promise.race([ahead, new Promise((r) => setTimeout(r, 8000))]);
			// hls.js wherever it runs (Safari included, from iOS 17.1), so every browser starts on the
			// sharpest rendition the box can use instead of the lowest one: the default bandwidth guess
			// is set high and the player still steps down if the connection cannot keep up.
			const { default: Hls } = await import('hls.js/light');
			if (!Hls.isSupported()) {
				video.src = src;
				return;
			}
			const hls = new Hls({
				capLevelToPlayerSize: true,
				// An adaptive showreel assumes a phone connection until it has measured one; the rest assume broadband.
				abrEwmaDefaultEstimate: adaptive ? 2_000_000 : 25_000_000,
				abrBandWidthUpFactor: 0.9,
				maxBufferLength: 30,
				backBufferLength: 10,
				startFragPrefetch: true,
			});
			// Start on the best rendition the box can show (capLevelToPlayerSize takes over once playing).
			hls.on(Hls.Events.MANIFEST_PARSED, () => (hls.startLevel = startLevel(hls.levels, video, adaptive)));
			hls.on(Hls.Events.ERROR, (_event, data) => {
				if (!data.fatal) return;
				// A dropped network: try again. A decode problem: let hls.js recover. Anything else: the browser's own player.
				if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
				else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
				else {
					hls.destroy();
					video.src = src;
					play(video);
				}
			});
			hls.loadSource(src);
			hls.attachMedia(video);
			players.set(video, hls);
		};
		const run = (video: HTMLVideoElement) => {
			if (!displayed(video)) return video.pause();
			if (awaitingCarry(video)) return;
			void attach(video).then(() => play(video));
		};
		const near = new IntersectionObserver(
			(entries) => entries.forEach((entry) => entry.isIntersecting && displayed(entry.target) && void attach(entry.target as HTMLVideoElement)),
			{ rootMargin: '100% 0px' },
		);
		const onScreen = new IntersectionObserver(
			(entries) =>
				entries.forEach((entry) => {
					const video = entry.target as HTMLVideoElement;
					if (entry.isIntersecting) run(video);
					else video.pause();
				}),
			{ threshold: 0.15 },
		);
		videos.forEach((v) => {
			near.observe(v);
			onScreen.observe(v);
		});
		vm = { videos, attached, players, onScreen, run };
		const portrait = matchMedia('(orientation: portrait)');
		const sync = () => vm?.videos.forEach(run);
		portrait.addEventListener('change', sync);
		// Coming back to the tab resumes whatever is on screen.
		const onVisible = () => document.visibilityState === 'visible' && vm?.videos.forEach((v) => attached.has(v) && displayed(v) && play(v));
		document.addEventListener('visibilitychange', onVisible);
		cleanups.push(() => {
			near.disconnect();
			onScreen.disconnect();
			portrait.removeEventListener('change', sync);
			document.removeEventListener('visibilitychange', onVisible);
			// A carried cover keeps playing. The others keep their last frame until
			// the old page has been swapped out, since shutting a stream down blanks
			// its element to the poster; only then are the players destroyed.
			const leaving = new Map(players);
			players.clear();
			window.setTimeout(() => leaving.forEach((player, video) => !video.hasAttribute('data-carried') && player.destroy()), 2000);
			vm = null;
		});
	}

	// Warm the hero a tile opens into: hovering (or touching) a tile fetches the
	// hero-sized candidate of the same picture, so the flip lands on a loaded image.
	q<HTMLElement>('[data-warm-sizes]').forEach((tile) => {
		let warmed = false;
		const warm = () => {
			if (warmed) return;
			warmed = true;
			const img = tile.querySelector<HTMLImageElement>('img[srcset]');
			if (!img) return;
			const probe = new Image();
			probe.sizes = tile.dataset.warmSizes!;
			probe.srcset = img.srcset;
		};
		for (const type of ['mouseenter', 'focusin', 'touchstart']) tile.addEventListener(type, warm, { passive: true, once: true });
	});

	// Pictures the next page opens on (the first Projects tiles, from home) are
	// fetched once this page has loaded and gone idle, each at the candidate
	// the browser would pick for this screen. While a showreel is still
	// fetching its first seconds, they wait for it (or 6 s) so as not to slow it.
	const reel = Array.from(warming.values());
	const reelFirst = reel.length ? Promise.race([Promise.all(reel), new Promise((r) => setTimeout(r, 6000))]) : Promise.resolve();
	q<HTMLElement>('[data-warm-idle]').forEach((box) => {
		const warm = () =>
			box.querySelectorAll<HTMLImageElement>('img[srcset]').forEach((img) => {
				const probe = new Image();
				probe.sizes = img.sizes;
				probe.srcset = img.srcset;
			});
		const idle = () => void reelFirst.then(() => ('requestIdleCallback' in window ? requestIdleCallback(warm, { timeout: 4000 }) : setTimeout(warm, 1500)));
		if (document.readyState === 'complete') idle();
		else addEventListener('load', idle, { once: true });
	});

	// Splash, accordions, the Studio sync
	q<HTMLElement>('[data-splash]').forEach((el) => cleanups.push(initSplash(el)));
	q<HTMLElement>('[data-accordion]').forEach((el) => cleanups.push(initAccordion(el)));
	q<HTMLElement>('[data-cycle]').forEach((el) => cleanups.push(initCycle(el)));
	q<HTMLElement>('[data-studio]').forEach((el) => cleanups.push(initStudio(el)));
	q<HTMLCanvasElement>('canvas[data-pong]').forEach((el) => cleanups.push(initPong(el)));

	ScrollTrigger.refresh();
}

/**
 * Adds `is-loaded` to every Sanity image once it has pixels: once it has
 * decoded, not merely loaded. A cached image counts as complete before it
 * has decoded, and lifting the blur then let a large JPEG paint its early
 * progressive scans as blocks for a few frames on a page arriving from the
 * back button (Ross, 3 Nov). Decoding a cached image takes a moment at most,
 * and the transitions wait for the pictures on screen before fading a page
 * in (transitions.ts decoded), so the blur is not seen.
 */
export function markImages(root: ParentNode = document) {
	root.querySelectorAll<HTMLImageElement>('img[data-img]').forEach((img) => {
		if (img.classList.contains('is-loaded')) return;
		const done = () => img.classList.add('is-loaded');
		const decoded = () => img.decode().then(done, done);
		if (img.complete && img.naturalWidth > 0) void decoded();
		else {
			img.addEventListener('load', () => void decoded(), { once: true });
			img.addEventListener('error', done, { once: true });
		}
	});
}

export function destroyPage() {
	ctx?.revert();
	ctx = null;
	cleanups.splice(0).forEach((fn) => fn());
}
