import { gsap, reducedMotion } from './motion';

/**
 * The cursor: the ID roundel on the pointer (Nick's thought, 22 Oct), which
 * inverts in solid brand colours, lime over anything dark and ink over
 * anything light, with nothing showing through (Ross; how is in
 * global.css). It doubles over anything clickable and steps aside for the
 * native caret in text fields. Base.astro renders it as three layers; this
 * moves them together and hides the native arrow through the `has-cursor`
 * class on <html>. Only on devices with a fine pointer that hovers, never
 * under reduced motion.
 */
export function initCursor(): void {
	if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches || reducedMotion()) return;
	const layers = Array.from(document.querySelectorAll<HTMLElement>('.cursor'));
	if (!layers.length) return;
	const root = document.documentElement;
	root.classList.add('has-cursor');
	// The client router replaces every attribute on <html> with the next
	// page's, which drops the class and brings the native arrow back next to
	// the roundel. Put it back straight after each swap, before the new page
	// paints.
	document.addEventListener('astro:after-swap', () => root.classList.add('has-cursor'));

	// GSAP owns the transform (and pins scale), so the CSS grows the layers by width and height.
	gsap.set(layers, { xPercent: -50, yPercent: -50 });
	const x = gsap.quickTo(layers, 'x', { duration: 0.15, ease: 'power2.out' });
	const y = gsap.quickTo(layers, 'y', { duration: 0.15, ease: 'power2.out' });
	const toggle = (name: string, on: boolean) => layers.forEach((el) => el.classList.toggle(name, on));

	const INTERACTIVE = 'a, button, summary, [role="button"], label, select, [data-flip]';
	const TYPING = 'input, textarea, [contenteditable]';
	let shown = false;
	document.addEventListener(
		'pointermove',
		(e) => {
			if (!shown) {
				shown = true;
				gsap.set(layers, { x: e.clientX, y: e.clientY });
			}
			x(e.clientX);
			y(e.clientY);
			const target = e.target as Element | null;
			const typing = Boolean(target?.closest(TYPING));
			toggle('is-hidden', typing);
			toggle('is-link', !typing && Boolean(target?.closest(INTERACTIVE)));
		},
		{ passive: true },
	);
	document.addEventListener('pointerdown', () => toggle('is-down', true));
	document.addEventListener('pointerup', () => toggle('is-down', false));
	document.addEventListener('mouseleave', () => toggle('is-hidden', true));
}
