/**
 * Splash home page: any scroll intent (wheel, swipe, arrow keys) goes to
 * Projects, the page sliding up into the work, as does clicking anywhere.
 * Nothing moves before the commit, so the slide is the only motion and it
 * starts from rest; scrolling never drags the page about first.
 */
import { track } from './analytics';

/** Watch time as a band, for GA4's `label` dimension. The showreel runs about a minute and a half, so the last band is a full play or more. */
const BANDS: [limit: number, name: string][] = [
	[5, 'under 5s'],
	[15, '5 to 14s'],
	[30, '15 to 29s'],
	[60, '30 to 59s'],
	[90, '60 to 89s'],
];
const watchBand = (seconds: number): string => BANDS.find(([limit]) => seconds < limit)?.[1] ?? '90s or more';

export function initSplash(section: HTMLElement): () => void {
	const link = section.querySelector<HTMLAnchorElement>('[data-advance-link]');
	// In the editors' preview a scroll is a look, not a move to Projects; the link itself still works.
	if (!link || document.documentElement.hasAttribute('data-preview')) return () => {};

	const WHEEL = 12; // px of downward wheel delta before it counts
	const SWIPE = 28; // px of upward swipe
	let committed = false;
	let touchY: number | null = null;

	// Watch time counts only while the tab is in front: a showreel left open in the background is not being watched.
	let watched = 0;
	let since: number | null = document.visibilityState === 'visible' ? performance.now() : null;
	const onVisibility = () => {
		if (document.visibilityState === 'visible') {
			since ??= performance.now();
		} else if (since != null) {
			watched += performance.now() - since;
			since = null;
		}
	};
	const secondsWatched = () => Math.round((watched + (since != null ? performance.now() - since : 0)) / 1000);

	// How people leave the showreel, and how long they watched it first (analytics.ts). GA4 only reports what it
	// knows: `value` is its built-in event value (total seconds, so an average), `label` the registered dimension
	// (the spread); `seconds` stays for a custom metric, should one be registered.
	const report = (method: string) => {
		const seconds = secondsWatched();
		track('showreel_advance', { method, seconds, value: seconds, label: watchBand(seconds) });
	};

	const commit = (method: string) => {
		if (committed) return;
		committed = true;
		report(method);
		link.click();
	};

	const onWheel = (e: WheelEvent) => {
		if (e.deltaY >= WHEEL) commit('scroll');
	};
	const onTouchStart = (e: TouchEvent) => (touchY = e.touches[0]?.clientY ?? null);
	const onTouchMove = (e: TouchEvent) => {
		const y = e.touches[0]?.clientY;
		if (touchY != null && y != null && touchY - y >= SWIPE) commit('swipe');
	};
	const onKey = (e: KeyboardEvent) => {
		if ((e.target as HTMLElement | null)?.closest('input, textarea, [contenteditable]')) return;
		if (['ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) {
			e.preventDefault();
			commit('key');
		}
	};
	// A click or tap on the showreel itself; commit()'s own click is not trusted, so it is not counted twice.
	const onLinkClick = (e: MouseEvent) => {
		if (!e.isTrusted || committed) return;
		committed = true;
		report('click');
	};

	document.addEventListener('visibilitychange', onVisibility);
	link.addEventListener('click', onLinkClick);
	window.addEventListener('wheel', onWheel, { passive: true });
	window.addEventListener('touchstart', onTouchStart, { passive: true });
	window.addEventListener('touchmove', onTouchMove, { passive: true });
	window.addEventListener('keydown', onKey);

	return () => {
		document.removeEventListener('visibilitychange', onVisibility);
		link.removeEventListener('click', onLinkClick);
		window.removeEventListener('wheel', onWheel);
		window.removeEventListener('touchstart', onTouchStart);
		window.removeEventListener('touchmove', onTouchMove);
		window.removeEventListener('keydown', onKey);
	};
}
