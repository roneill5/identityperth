import { gsap, ScrollTrigger, EASE, reducedMotion } from './motion';
import { initSplash } from './splash';
import { initCycle } from './cycle';
import { initStudio } from './studio';
import { initAccordion } from './accordion';
import { initPong } from './eggs/pong';
import { initDog } from './eggs/dog';

/**
 * Per-page behaviour. Everything created here is torn down in `destroyPage`
 * before Swup swaps the content, then set up again for the new page.
 *
 * Hooks (add the attribute in markup, no JS needed per component):
 *   data-reveal            fade and rise into view once, when scrolled to
 *   data-reveal-group      stagger the direct children instead
 *   data-parallax="0.15"   drift vertically at a fraction of scroll speed
 *   data-loop-video        (on <video>) play while on screen, pause off screen
 *   data-splash            scroll or swipe commits the move to Projects
 *   data-accordion         animated <details> inside; data-group makes them exclusive
 *   data-cycle             a heading that cycles through its [data-phrase] children
 *   data-studio            the Studio page: photo column and accordion in step
 *   data-pong              a <canvas> that plays Pong
 *   data-dog               a zone that wakes the pixel dog while on screen
 */

let ctx: gsap.Context | null = null;
const cleanups: Array<() => void> = [];

export function initPage(root: ParentNode = document) {
	destroyPage();
	const container = root.querySelector<HTMLElement>('#swup') ?? document.body;
	const reduce = reducedMotion();

	ctx = gsap.context(() => {
		// Reveal on scroll
		root.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
			if (reduce) return;
			gsap.from(el, {
				opacity: 0,
				y: 24,
				duration: 0.9,
				ease: EASE.out,
				scrollTrigger: { trigger: el, start: 'top 90%', once: true },
			});
		});

		// Groups reveal item by item as each one enters, so a long grid never
		// waits on a single stagger from the top.
		root.querySelectorAll<HTMLElement>('[data-reveal-group]').forEach((group) => {
			const items = Array.from(group.children) as HTMLElement[];
			if (reduce || !items.length) return;
			gsap.set(items, { opacity: 0, y: 24 });
			ScrollTrigger.batch(items, {
				start: 'top 92%',
				once: true,
				onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.9, ease: EASE.out, stagger: 0.07, overwrite: true }),
			});
		});

		// Parallax drift
		root.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
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

	// Loop videos play only while visible
	const loops = Array.from(root.querySelectorAll<HTMLVideoElement>('[data-loop-video]'));
	if (loops.length) {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					const video = entry.target as HTMLVideoElement;
					if (entry.isIntersecting) void video.play().catch(() => {});
					else video.pause();
				});
			},
			{ threshold: 0.15 },
		);
		loops.forEach((v) => observer.observe(v));
		cleanups.push(() => observer.disconnect());
	}

	// Splash, accordions, games and pets
	root.querySelectorAll<HTMLElement>('[data-splash]').forEach((el) => cleanups.push(initSplash(el)));
	root.querySelectorAll<HTMLElement>('[data-accordion]').forEach((el) => cleanups.push(initAccordion(el)));
	root.querySelectorAll<HTMLElement>('[data-cycle]').forEach((el) => cleanups.push(initCycle(el)));
	root.querySelectorAll<HTMLElement>('[data-studio]').forEach((el) => cleanups.push(initStudio(el)));
	root.querySelectorAll<HTMLCanvasElement>('canvas[data-pong]').forEach((el) => cleanups.push(initPong(el)));
	root.querySelectorAll<HTMLElement>('[data-dog]').forEach((el) => cleanups.push(initDog(el)));

	ScrollTrigger.refresh();
}

/**
 * Adds `is-loaded` to every Sanity image once it has pixels. Called before
 * first paint of new content as well as from initPage, so cached images
 * never flash from blurred to sharp.
 */
export function markImages(root: ParentNode = document) {
	root.querySelectorAll<HTMLImageElement>('img[data-img]').forEach((img) => {
		if (img.classList.contains('is-loaded')) return;
		const done = () => img.classList.add('is-loaded');
		if (img.complete && img.naturalWidth > 0) done();
		else {
			img.addEventListener('load', done, { once: true });
			img.addEventListener('error', done, { once: true });
		}
	});
}

export function destroyPage() {
	ctx?.revert();
	ctx = null;
	cleanups.splice(0).forEach((fn) => fn());
}
