/**
 * Splash home page: any scroll intent (wheel, swipe, arrow keys) goes to
 * Projects through the ticker curtain, as does clicking anywhere. Nothing
 * moves before the commit, so the curtain is the only motion and it starts
 * from rest; scrolling never drags the ticker about first.
 */
export function initSplash(section: HTMLElement): () => void {
	const link = section.querySelector<HTMLAnchorElement>('[data-advance-link]');
	if (!link) return () => {};

	const WHEEL = 12; // px of downward wheel delta before it counts
	const SWIPE = 28; // px of upward swipe
	let committed = false;
	let touchY: number | null = null;

	const commit = () => {
		if (committed) return;
		committed = true;
		link.click();
	};

	const onWheel = (e: WheelEvent) => {
		if (e.deltaY >= WHEEL) commit();
	};
	const onTouchStart = (e: TouchEvent) => (touchY = e.touches[0]?.clientY ?? null);
	const onTouchMove = (e: TouchEvent) => {
		const y = e.touches[0]?.clientY;
		if (touchY != null && y != null && touchY - y >= SWIPE) commit();
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
	};
}
