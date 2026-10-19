import Swup from 'swup';
import SwupJsPlugin from '@swup/js-plugin';
import SwupPreloadPlugin from '@swup/preload-plugin';
import { gsap, reducedMotion } from './motion';
import { initMenu } from './menu';
import { initPage, destroyPage, markImages } from './page';
import { initWeather } from './weather';
import { initEggs } from './eggs';
import { armFlips, curtainIn, curtainOut, flipIn, flipOut } from './transitions';

/**
 * App entry. Runs once per full page load. Swup turns link clicks into
 * fetch-and-swap navigations inside #swup; the sidebar and menu persist.
 *
 * Transitions:
 *   splash home -> anywhere   the ticker screen rises as a curtain, the new
 *                             page is swapped in beneath it, and it keeps
 *                             going until it is gone (transitions.ts)
 *   project tile -> project   the cover grows into the hero (transitions.ts)
 *   everything else           0.3 s fade out, 0.5 s fade in with a short rise
 */

const container = '#swup';
const menu = initMenu();

const fadeOut = async () => {
	if (reducedMotion()) return;
	await gsap.to(container, { opacity: 0, duration: 0.3, ease: 'power1.inOut' });
};

const fadeIn = async () => {
	if (reducedMotion()) {
		gsap.set(container, { clearProps: 'all' });
		return;
	}
	// No vertical movement on the splash: its ticker screen is fixed inside the container.
	const rise = document.body.dataset.page === 'splash' ? 0 : 12;
	await gsap.fromTo(container, { opacity: 0, y: rise }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', clearProps: 'all' });
};

const swup = new Swup({
	containers: [container],
	// The JS plugin drives the transition, so Swup's CSS class timing is off.
	animationSelector: false,
	plugins: [
		new SwupPreloadPlugin({ preloadHoveredLinks: true }),
		new SwupJsPlugin({
			animations: [
				{ from: '/', to: '(.*)', out: () => curtainOut(fadeOut), in: () => curtainIn(fadeIn) },
				{ from: '(.*)', to: '/projects/:slug', out: () => flipOut(fadeOut), in: () => flipIn(fadeIn) },
				{ from: '(.*)', to: '(.*)', out: fadeOut, in: fadeIn },
			],
		}),
	],
});

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

swup.hooks.on('visit:start', () => menu.close(true));
swup.hooks.before('content:replace', () => destroyPage());
swup.hooks.on('content:replace', () => {
	syncPageKind();
	markImages();
});
swup.hooks.on('page:view', () => {
	updateNav();
	initPage();
});

updateNav();
syncPageKind();
armFlips();
initWeather();
initEggs();
initPage();
