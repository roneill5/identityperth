/**
 * Splash home page: any scroll intent (wheel, swipe, arrow keys) goes to
 * Projects, the page sliding up into the work, as does clicking anywhere.
 * Nothing moves before the commit, so the slide is the only motion and it
 * starts from rest; scrolling never drags the page about first.
 */
import { track } from './analytics';

export function initSplash(section: HTMLElement): () => void {
	const link = section.querySelector<HTMLAnchorElement>('[data-advance-link]');
	if (!link) return () => {};

	const WHEEL = 12; // px of downward wheel delta before it counts
	const SWIPE = 28; // px of upward swipe
	let committed = false;
	let touchY: number | null = null;
	const shownAt = performance.now();

	// How people leave the showreel, and how long they watched it first (analytics.ts).
	const report = (method: string) => track('showreel_advance', { method, seconds: Math.round((performance.now() - shownAt) / 1000) });

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

	link.addEventListener('click', onLinkClick);
	window.addEventListener('wheel', onWheel, { passive: true });
	window.addEventListener('touchstart', onTouchStart, { passive: true });
	window.addEventListener('touchmove', onTouchMove, { passive: true });
	window.addEventListener('keydown', onKey);

	return () => {
		link.removeEventListener('click', onLinkClick);
		window.removeEventListener('wheel', onWheel);
		window.removeEventListener('touchstart', onTouchStart);
		window.removeEventListener('touchmove', onTouchMove);
		window.removeEventListener('keydown', onKey);
	};
}
