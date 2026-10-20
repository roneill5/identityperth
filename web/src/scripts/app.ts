import Swup from 'swup';
import SwupJsPlugin from '@swup/js-plugin';
import SwupPreloadPlugin from '@swup/preload-plugin';
import { gsap, reducedMotion } from './motion';
import { initMenu } from './menu';
import { initPage, destroyPage, markImages } from './page';
import { initWeather } from './weather';
import { armFlips, curtainIn, curtainOut, flipIn, flipOut, unflipIn, unflipOut } from './transitions';

/**
 * App entry. Runs once per full page load. Swup turns link clicks into
 * fetch-and-swap navigations inside #swup; the sidebar and menu persist.
 *
 * Transitions:
 *   splash home -> anywhere   the ticker screen rises as a curtain, the new
 *                             page is swapped in beneath it, and it keeps
 *                             going until it is gone (transitions.ts)
 *   project tile -> project   the cover grows into the hero (transitions.ts)
 *   project -> projects       the hero shrinks back into its tile, also on the
 *                             back button
 *   everything else           0.2 s fade out, 0.35 s fade in with a short rise
 *
 * History navigation animates too; scroll positions are remembered per URL
 * and put back on the way back.
 */

const container = '#swup';
// Both containers are swapped; the ticker one is empty on inner pages.
const containers = ['#swup', '#ticker'];
const menu = initMenu();

const fadeOut = async () => {
	if (reducedMotion()) return;
	await gsap.to(container, { opacity: 0, duration: 0.2, ease: 'power1.in' });
};

const fadeIn = async () => {
	if (reducedMotion()) {
		gsap.set(container, { clearProps: 'all' });
		return;
	}
	// No vertical movement on the splash: its ticker screen is fixed inside the container.
	const rise = document.body.dataset.page === 'splash' ? 0 : 8;
	await gsap.fromTo(container, { opacity: 0, y: rise }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out', clearProps: 'all' });
};

const swup = new Swup({
	containers,
	// The JS plugin drives the transition, so Swup's CSS class timing is off.
	animationSelector: false,
	animateHistoryBrowsing: true,
	plugins: [
		// Hovered links fetch early; links on screen fetch after a moment, so
		// the next page is usually already here when it is clicked.
		new SwupPreloadPlugin({ preloadHoveredLinks: true, preloadVisibleLinks: { delay: 400, threshold: 0.2 } }),
		new SwupJsPlugin({
			animations: [
				{ from: '/', to: '(.*)', out: () => curtainOut(fadeOut), in: () => curtainIn(fadeIn) },
				{ from: '/projects/:slug', to: '/projects', out: () => unflipOut(fadeOut), in: () => unflipIn(fadeIn) },
				{ from: '(.*)', to: '/projects/:slug', out: () => flipOut(fadeOut), in: () => flipIn(fadeIn) },
				{ from: '(.*)', to: '(.*)', out: fadeOut, in: fadeIn },
			],
		}),
	],
});

// Scroll memory for the back and forward buttons.
const scrollPositions = new Map<string, number>();

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
	const kind = document.querySelector<HTMLElement>('#main')?.dataset.page ?? '';
	if (kind) document.body.dataset.page = kind;
	else delete document.body.dataset.page;
}

swup.hooks.on('visit:start', (visit) => {
	menu.close(true);
	scrollPositions.set(visit.from.url, window.scrollY);
	if (visit.history.popstate) visit.scroll.reset = false;
});
swup.hooks.before('content:replace', () => destroyPage());
swup.hooks.on('content:replace', (visit) => {
	syncPageKind();
	markImages();
	if (visit.history.popstate) window.scrollTo(0, scrollPositions.get(visit.to.url) ?? 0);
});
swup.hooks.on('page:view', () => {
	updateNav();
	initPage();
});

// Editors' preview: overlays and Studio sync, loaded only when the page says so.
if (document.documentElement.hasAttribute('data-preview')) void import('./preview').then((m) => m.initPreview(swup));

updateNav();
syncPageKind();
armFlips();
initWeather();
initPage();
