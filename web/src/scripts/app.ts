import { swapFunctions, type TransitionBeforePreparationEvent, type TransitionBeforeSwapEvent } from 'astro:transitions/client';
import { gsap, ScrollTrigger, reducedMotion } from './motion';
import { initMenu } from './menu';
import { initPage, destroyPage, markImages } from './page';
import { initCursor } from './cursor';
import { initAnalytics } from './analytics';
import { armFlips, slideIn, slideOut, flipIn, flipOut, unflipIn, unflipOut, decoded } from './transitions';

/**
 * App entry. Runs once per full page load. Astro's client router (the
 * <ClientRouter /> in Base.astro) turns link clicks into fetch-and-swap
 * navigations; the swap below replaces only #page and #ticker, so the
 * sidebar and the menu never move. The router's own animations
 * are off (transition:animate="none" on <html>); GSAP does the choreography:
 *
 *   splash home -> anywhere   the ticker screen rises as a curtain, the new
 *                             page is swapped in beneath it, and it keeps
 *                             going until it is gone (transitions.ts)
 *   project tile -> project   the cover grows into the hero (transitions.ts)
 *   project -> projects       the hero shrinks back into its tile, also on the
 *                             back button
 *   everything else           0.2 s fade out, 0.35 s fade in with a short rise
 *
 * The leaving animation runs while the next page loads (the router waits
 * for both), the arriving one after the swap. Back and forward animate too;
 * the router puts scroll positions back itself.
 */

const PAGE = '#page';
const menu = initMenu();
// Before the first astro:page-load, so the first page view is seen as the first.
initAnalytics();

// The scroll line along the top of the viewport (global.css) stands in for the scrollbar.
const scrollLine = document.querySelector<HTMLElement>('.scroll-line');
if (scrollLine) {
	let frame = 0;
	const draw = () => {
		frame = 0;
		const room = document.documentElement.scrollHeight - window.innerHeight;
		scrollLine.style.transform = `scaleX(${room > 0 ? Math.min(1, Math.max(0, window.scrollY / room)) : 0})`;
	};
	const queue = () => (frame ||= requestAnimationFrame(draw));
	window.addEventListener('scroll', queue, { passive: true });
	window.addEventListener('resize', queue);
	document.addEventListener('astro:page-load', queue);
	draw();
}

const fadeOut = async () => {
	if (reducedMotion()) return;
	await gsap.to(PAGE, { opacity: 0, duration: 0.2, ease: 'power1.in' });
};

const fadeIn = async () => {
	if (reducedMotion()) {
		gsap.set(PAGE, { clearProps: 'all' });
		return;
	}
	// No vertical movement on the splash: its ticker screen is fixed inside the page.
	const rise = document.body.dataset.page === 'splash' ? 0 : 8;
	// Its pictures first, briefly, so the fade shows them rather than their placeholders.
	await decoded(300);
	await gsap.fromTo(PAGE, { opacity: 0, y: rise }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out', clearProps: 'all' });
};

interface Transition {
	out: () => Promise<void>;
	in: () => Promise<void>;
	/** Runs right after the swap, before the new page paints (its starting position). */
	prepare?: () => void;
	/** Hide the new page as soon as it lands, until `in` reveals it. */
	hide: boolean;
}

/** The site path for a URL, with the preview prefix taken off. */
const sitePath = (url: URL) => url.pathname.replace(/^\/preview(?=\/|$)/, '').replace(/\/+$/, '') || '/';
const PROJECT = /^\/projects\/[^/]+$/;

function pick(from: URL, to: URL): Transition {
	const a = sitePath(from);
	const b = sitePath(to);
	if (a === '/' && document.querySelector('[data-hero]')) return { out: () => slideOut(fadeOut), in: () => slideIn(fadeIn), hide: false, prepare: () => gsap.set(PAGE, { y: window.innerHeight }) };
	if (PROJECT.test(a) && b === '/projects') return { out: () => unflipOut(fadeOut), in: () => unflipIn(fadeIn), hide: true };
	if (PROJECT.test(b)) return { out: () => flipOut(fadeOut), in: () => flipIn(fadeIn), hide: true };
	return { out: fadeOut, in: fadeIn, hide: true };
}

let current: Transition | null = null;

/** Keep the sidebar's active link in step with the current URL. */
function updateNav(pathname = location.pathname) {
	document.querySelectorAll<HTMLAnchorElement>('[data-nav-link]').forEach((link) => {
		const href = link.getAttribute('href') ?? '';
		const active = !href.startsWith('http') && (pathname === href || pathname.startsWith(`${href}/`));
		if (active) link.setAttribute('aria-current', 'page');
		else link.removeAttribute('aria-current');
	});
}

/** Pages declare their kind on #main; the body mirrors it so CSS can react. */
function syncPageKind() {
	const kind = document.querySelector<HTMLElement>('#page #main')?.dataset.page ?? '';
	if (kind) document.body.dataset.page = kind;
	else delete document.body.dataset.page;
}

// Scrolling is held while a transition runs: a wheel, swipe or key press
// would otherwise drag the arriving page about mid-move (Ross, 29 Oct). The
// input is swallowed, and the root is made unscrollable too (is-transitioning,
// global.css): a swipe that began on the old page keeps going to its
// detached target after the swap, where no listener can reach it, and only
// an unscrollable root stops the browser scrolling the new page under it.
// There is no native scrollbar, so nothing jumps when overflow is hidden.
// A swipe's events go on targeting the element the finger landed on, even
// once the swap has detached it, and iOS scrolls on regardless of the root
// and then carries the swipe's momentum into the new page (Ross, 30 Oct: on
// his phone, how far he swiped the home video set how far down Projects he
// landed). So a move a finger started holds harder: the hold listens on that
// element, where the events still arrive, pins the body as well (is-held,
// global.css) so there is nothing for the momentum to scroll, keeps the page
// at the top, and ends only once the finger has lifted and its momentum has
// had nowhere to go for a moment.
const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']);
const swallow = (e: Event) => {
	if (e instanceof KeyboardEvent && !SCROLL_KEYS.has(e.key)) return;
	// A touch move the browser is already scrolling on cannot be cancelled; trying logs a console warning on every one.
	if (e.cancelable) e.preventDefault();
};
const MOMENTUM = 450; // ms after the finger lifts before the hold can end
const BACKSTOP = 2500; // ms after which a finger-held page is let go regardless
let touched: EventTarget | null = null;
let held: EventTarget | null = null;
let pinned = false;
let releasing = false;
let settling = 0;
let backstop = 0;
window.addEventListener('touchstart', (e) => (touched = e.target), { capture: true, passive: true });
window.addEventListener('touchend', () => (touched = null), { capture: true, passive: true });
window.addEventListener('touchcancel', () => (touched = null), { capture: true, passive: true });
const pin = () => {
	if (pinned && window.scrollY) window.scrollTo(0, 0);
};
const unhold = () => {
	held?.removeEventListener('touchmove', swallow);
	held?.removeEventListener('touchend', endTouch);
	held?.removeEventListener('touchcancel', endTouch);
	held = null;
};
const settled = () => {
	settling = 0;
	window.clearTimeout(backstop);
	backstop = 0;
	unhold();
	if (releasing) releaseScroll();
};
const endTouch = () => {
	unhold();
	window.clearTimeout(settling);
	settling = window.setTimeout(settled, MOMENTUM);
};
const holdScroll = () => {
	document.documentElement.classList.add('is-transitioning');
	window.addEventListener('wheel', swallow, { passive: false });
	window.addEventListener('touchmove', swallow, { passive: false });
	window.addEventListener('keydown', swallow);
	window.addEventListener('scroll', pin);
	releasing = false;
	window.clearTimeout(settling);
	window.clearTimeout(backstop);
	settling = backstop = 0;
	unhold();
	if (touched) {
		held = touched;
		pinned = true;
		document.documentElement.classList.add('is-held');
		held.addEventListener('touchmove', swallow, { passive: false });
		held.addEventListener('touchend', endTouch);
		held.addEventListener('touchcancel', endTouch);
		backstop = window.setTimeout(settled, BACKSTOP);
	}
};
const releaseScroll = () => {
	releasing = true;
	// The finger that started the move is still down, or has only just lifted.
	if (held || settling) return;
	document.documentElement.classList.remove('is-transitioning', 'is-held');
	window.removeEventListener('wheel', swallow);
	window.removeEventListener('touchmove', swallow);
	window.removeEventListener('keydown', swallow);
	window.removeEventListener('scroll', pin);
	if (pinned) {
		pinned = false;
		window.scrollTo(0, 0);
		// The page was measured while the body was fixed.
		ScrollTrigger.refresh();
	}
};

// A navigation starts: close the menu and play the leaving animation while the next page loads.
document.addEventListener('astro:before-preparation', (e) => {
	const event = e as TransitionBeforePreparationEvent;
	menu.close(true);
	holdScroll();
	current = pick(event.from, event.to);
	const load = event.loader;
	const leaving = current.out();
	event.loader = async () => {
		await Promise.all([load(), leaving]);
	};
});

// The next page is here: tear the old one down and swap just the page containers.
document.addEventListener('astro:before-swap', (e) => {
	const event = e as TransitionBeforeSwapEvent;
	destroyPage();
	event.swap = () => {
		const doc = event.newDocument;
		swapFunctions.deselectScripts(doc);
		swapFunctions.swapRootAttributes(doc);
		swapFunctions.swapHeadElements(doc);
		const restoreFocus = swapFunctions.saveFocus();
		for (const id of ['page', 'ticker']) {
			const oldEl = document.getElementById(id);
			const newEl = doc.getElementById(id);
			if (oldEl && newEl) oldEl.replaceWith(newEl);
		}
		restoreFocus();
	};
});

document.addEventListener('astro:after-swap', () => {
	// The swap replaces every attribute on <html>, which drops the hold's classes; the listeners survive.
	if (current) document.documentElement.classList.add('is-transitioning');
	if (current && pinned) document.documentElement.classList.add('is-held');
	syncPageKind();
	markImages();
	current?.prepare?.();
	if (current?.hide) gsap.set(PAGE, { opacity: 0 });
});

// Also fires on the first load, which is what sets the first page up.
document.addEventListener('astro:page-load', () => {
	updateNav();
	initPage();
	const transition = current;
	current = null;
	if (transition) void transition.in().finally(releaseScroll);
	else releaseScroll();
});

// Editors' preview: the overlays and Studio sync load from PreviewEditing.astro.
// The custom cursor stays off there: the overlays live in a shadow DOM the
// cursor's styles cannot reach, so editors would see the arrow and the dot.
const preview = document.documentElement.hasAttribute('data-preview');

updateNav();
syncPageKind();
armFlips();
if (!preview) initCursor();
