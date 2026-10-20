import { gsap, EASE, reducedMotion } from './motion';

/**
 * Full-screen menu. Toggle buttons carry `data-menu-toggle`; the overlay is
 * `[data-menu]`. The menu lives outside the Swup container, so it is set up
 * once and closes itself when a navigation starts. It announces open and
 * close on `document` as `menu:toggle` for anything that cares (the duck).
 */
export function initMenu() {
	const menu = document.querySelector<HTMLElement>('[data-menu]');
	if (!menu) return { close: () => {}, isOpen: () => false };

	const toggles = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-menu-toggle]'));
	const items = Array.from(menu.querySelectorAll<HTMLElement>('[data-menu-item]'));
	const contact = menu.querySelector<HTMLElement>('[data-menu-contact]');
	// The ID mark sits where the sidebar's does; ENTITY unfolds from it.
	const letters = Array.from(menu.querySelectorAll<SVGElement>('[data-menu-brand] .logo__letter'));
	const labelsClosed = document.querySelectorAll<HTMLElement>('[data-menu-label-closed]');
	const labelsOpen = document.querySelectorAll<HTMLElement>('[data-menu-label-open]');

	let open = false;
	let lastFocus: HTMLElement | null = null;

	const tl = gsap.timeline({ paused: true, defaults: { ease: EASE.out } });
	tl.set(menu, { visibility: 'visible' })
		.to(menu, { opacity: 1, duration: 0.28, ease: 'power2.out' }, 0)
		.from(letters, { opacity: 0, x: -12, duration: 0.45, stagger: 0.04 }, 0.04)
		.from(items, { yPercent: 110, opacity: 0, duration: 0.6, stagger: 0.05 }, 0.1)
		.from(contact, { opacity: 0, y: 12, duration: 0.5 }, 0.22);

	const setState = (next: boolean) => {
		open = next;
		menu.setAttribute('aria-hidden', String(!next));
		toggles.forEach((t) => t.setAttribute('aria-expanded', String(next)));
		labelsClosed.forEach((el) => (el.hidden = next));
		labelsOpen.forEach((el) => (el.hidden = !next));
		document.documentElement.style.overflow = next ? 'hidden' : '';
		document.documentElement.classList.toggle('menu-open', next);
		document.dispatchEvent(new CustomEvent('menu:toggle', { detail: { open: next } }));
	};

	const openMenu = () => {
		if (open) return;
		lastFocus = document.activeElement as HTMLElement | null;
		setState(true);
		if (reducedMotion()) tl.progress(1);
		else tl.timeScale(1).play(0);
		menu.querySelector<HTMLElement>('a, button')?.focus({ preventScroll: true });
	};

	const closeMenu = (instant = false) => {
		if (!open) return;
		setState(false);
		const finish = () => gsap.set(menu, { visibility: 'hidden', opacity: 0 });
		if (instant || reducedMotion()) {
			tl.pause(0);
			finish();
		} else {
			tl.timeScale(2.4).reverse().eventCallback('onReverseComplete', finish);
		}
		lastFocus?.focus({ preventScroll: true });
	};

	toggles.forEach((t) => t.addEventListener('click', () => (open ? closeMenu() : openMenu())));
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape') closeMenu();
	});

	return { close: closeMenu, isOpen: () => open };
}
