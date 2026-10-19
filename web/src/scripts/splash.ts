import { gsap, reducedMotion } from './motion';

/**
 * Splash home page: scrolling (wheel, swipe, arrow keys) drags the ticker
 * screen up a little; past the threshold it commits and the page moves to
 * Projects through the normal wipe transition. Let go early and it settles
 * back. Clicking anywhere does the same through the full-page link.
 */
export function initSplash(section: HTMLElement): () => void {
	const link = section.querySelector<HTMLAnchorElement>('[data-advance-link]');
	const screen = document.querySelector<HTMLElement>('[data-ticker-screen]');
	if (!link) return () => {};

	const THRESHOLD = 180; // px of scroll intent before committing
	const PEEK = 0.18; // how far up the ticker screen rises while dragging (fraction of viewport)
	let progress = 0;
	let committed = false;
	let touchY: number | null = null;
	let settle = 0;

	const setY = screen && !reducedMotion() ? gsap.quickTo(screen, 'y', { duration: 0.35, ease: 'power2.out' }) : null;
	const render = () => setY?.(-progress * window.innerHeight * PEEK);

	const commit = () => {
		if (committed) return;
		committed = true;
		window.clearTimeout(settle);
		link.click();
	};

	const nudge = (delta: number) => {
		if (committed || delta <= 0) return;
		progress = Math.min(1, progress + delta / THRESHOLD);
		render();
		if (progress >= 1) commit();
		else {
			window.clearTimeout(settle);
			settle = window.setTimeout(() => {
				progress = 0;
				render();
			}, 450);
		}
	};

	const onWheel = (e: WheelEvent) => nudge(e.deltaY);
	const onTouchStart = (e: TouchEvent) => (touchY = e.touches[0]?.clientY ?? null);
	const onTouchMove = (e: TouchEvent) => {
		const y = e.touches[0]?.clientY;
		if (touchY == null || y == null) return;
		nudge(touchY - y);
		touchY = y;
	};
	const onKey = (e: KeyboardEvent) => {
		if ((e.target as HTMLElement | null)?.closest('input, textarea, [contenteditable]')) return;
		if (['ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) {
			e.preventDefault();
			commit();
		}
	};

	window.addEventListener('wheel', onWheel, { passive: true });
	window.addEventListener('touchstart', onTouchStart, { passive: true });
	window.addEventListener('touchmove', onTouchMove, { passive: true });
	window.addEventListener('keydown', onKey);

	return () => {
		window.removeEventListener('wheel', onWheel);
		window.removeEventListener('touchstart', onTouchStart);
		window.removeEventListener('touchmove', onTouchMove);
		window.removeEventListener('keydown', onKey);
		window.clearTimeout(settle);
	};
}
