import { gsap, reducedMotion } from './motion';
import { arriveSettled } from './page';

/**
 * Page transitions beyond the plain fade.
 *
 * Curtain: on the splash home page the ticker screen (a viewport-high ink
 * panel with the ticker along its top edge) rises in one movement: the
 * first half covers the hero (which drifts up with it), the page is swapped
 * the instant it is covered, and the second half carries on at the same
 * speed, uncovering the new page from the bottom up. Reads as one scroll
 * from the hero to the work; nothing fades and nothing animates in after.
 *
 * Flip: clicking a project tile (`a[data-flip]`) pins a copy of its cover
 * where it was, fades the old page, then grows the copy into the new page's
 * hero (`[data-flip-target]`) while the rest of the page fades in. Leaving a
 * project for the Projects page (nav link or the back button) runs it in
 * reverse: the hero shrinks back into its tile.
 */

const CONTAINER = '#swup';

// ---------- curtain ----------

let curtain: HTMLElement | null = null;
let curtainTween: gsap.core.Tween | null = null;

const DURATION = 0.9;

export async function curtainOut(fallback: () => Promise<void>) {
	const screen = document.querySelector<HTMLElement>('[data-ticker-screen]');
	if (!screen) return fallback();
	// Lift it out of its Swup container so the swap leaves it in place. Moving
	// a node restarts its CSS animations, so the marquee's position is read
	// first and put back after. Above the sidebar, so the logo only shows once
	// the curtain has passed.
	const track = screen.querySelector<HTMLElement>('.ticker-track');
	const phase = track?.getAnimations()[0]?.currentTime ?? null;
	document.body.appendChild(screen);
	const restarted = track?.getAnimations()[0];
	if (restarted && phase != null) restarted.currentTime = phase;
	screen.style.zIndex = '60';
	curtain = screen;
	const top = parseFloat(getComputedStyle(screen).top) || window.innerHeight;
	// The new page's first screen is uncovered as it is: no entrance reveals.
	// (page:view, and so initPage, fires straight after the swap.)
	arriveSettled();
	if (reducedMotion()) {
		gsap.set(screen, { y: -top });
		return;
	}
	// One tween for the whole journey: the panel rises until the ticker is at
	// the top (the hero drifting up beneath it), the page swaps the instant
	// everything is covered, and the same tween carries on uncovering the
	// new page. Nothing stops or restarts at the join.
	const hero = document.querySelector<HTMLElement>('[data-hero] > div');
	const cover = top / (top + screen.offsetHeight);
	await new Promise<void>((resolve) => {
		let swapped = false;
		curtainTween = gsap.to(screen, {
			y: -(top + screen.offsetHeight),
			duration: DURATION,
			ease: 'power2.inOut',
			onUpdate() {
				if (!swapped && this.progress() >= cover) {
					swapped = true;
					resolve();
				}
			},
			onComplete: () => {
				if (!swapped) {
					swapped = true;
					resolve();
				}
			},
		});
		if (hero) gsap.to(hero, { y: -top * 0.25, duration: DURATION * cover, ease: 'power2.in' });
	});
}

export async function curtainIn(fallback: () => Promise<void>) {
	const screen = curtain;
	curtain = null;
	if (!screen) return fallback();
	gsap.set(CONTAINER, { clearProps: 'all' });
	if (curtainTween) {
		await curtainTween;
		curtainTween = null;
	}
	screen.remove();
}

// ---------- flip ----------

interface Pending {
	src: string;
	position: string;
	rect: DOMRect;
	/** The hover zoom on the cover at click time, so the copy starts identical. */
	zoom: number;
}

let pending: Pending | null = null;
let clone: HTMLElement | null = null;

/** Remember the cover of any `a[data-flip]` that is about to be followed. */
export function armFlips() {
	document.addEventListener(
		'click',
		(e) => {
			pending = null;
			if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
			const link = (e.target as HTMLElement | null)?.closest<HTMLAnchorElement>('a[data-flip]');
			const img = link?.querySelector<HTMLImageElement>('img');
			if (!link || !img?.currentSrc || !img.complete) return;
			// The cover's own box, not the zoomed image inside it: the copy must
			// never be larger than the hero it is heading for.
			const box = link.querySelector<HTMLElement>('[data-flip-box]') ?? link;
			const matrix = getComputedStyle(img).transform.match(/matrix\(([^,]+),/);
			pending = {
				src: img.currentSrc,
				position: getComputedStyle(img).objectPosition,
				rect: box.getBoundingClientRect(),
				zoom: matrix ? parseFloat(matrix[1]) || 1 : 1,
			};
		},
		true,
	);
}

export async function flipOut(fallback: () => Promise<void>) {
	const p = pending;
	pending = null;
	if (!p || reducedMotion()) return fallback();
	clone = document.createElement('div');
	clone.className = 'flip';
	clone.style.cssText = `left:${p.rect.left}px;top:${p.rect.top}px;width:${p.rect.width}px;height:${p.rect.height}px`;
	const img = new Image();
	img.src = p.src.replace(/([?&]w=)\d+/, '$11440');
	img.alt = '';
	img.style.objectPosition = p.position;
	img.style.backgroundImage = `url("${p.src}")`;
	img.style.transform = `scale(${p.zoom})`;
	clone.appendChild(img);
	document.body.appendChild(clone);
	await gsap.to(CONTAINER, { opacity: 0, duration: 0.3, ease: 'power1.inOut' });
}

export async function flipIn(fallback: () => Promise<void>) {
	const c = clone;
	clone = null;
	const target = document.querySelector<HTMLElement>('[data-flip-target]');
	if (!c || !target) {
		c?.remove();
		return fallback();
	}
	gsap.set(CONTAINER, { opacity: 0 });
	const r = target.getBoundingClientRect();
	const copy = c.querySelector('img');
	await gsap
		.timeline()
		.to(c, { left: r.left, top: r.top, width: r.width, height: r.height, duration: 0.9, ease: 'expo.inOut' }, 0)
		.to(copy, { scale: 1, duration: 0.9, ease: 'expo.inOut' }, 0)
		.to(CONTAINER, { opacity: 1, duration: 0.5, ease: 'power1.inOut', clearProps: 'all' }, 0.4);

	// Hold the copy until the hero underneath has pixels, so nothing flashes.
	const hero = target.querySelector<HTMLImageElement>('img');
	await new Promise<void>((resolve) => {
		if (!hero || (hero.complete && hero.naturalWidth > 0)) return resolve();
		const done = () => resolve();
		hero.addEventListener('load', done, { once: true });
		hero.addEventListener('error', done, { once: true });
		window.setTimeout(done, 1500);
	});
	await gsap.to(c, { opacity: 0, duration: 0.3, ease: 'power1.inOut' });
	c.remove();
}

// ---------- reverse flip ----------

let returning: { clone: HTMLElement; slug: string } | null = null;

/** Leaving a project page for the list: pin the hero where it is. */
export async function unflipOut(fallback: () => Promise<void>) {
	const target = document.querySelector<HTMLElement>('[data-flip-target]');
	const img = target?.querySelector<HTMLImageElement>('img');
	const rect = target?.getBoundingClientRect();
	// Only worth it when the hero is still on screen.
	if (!target || !img?.currentSrc || !rect || rect.bottom <= 0 || reducedMotion()) return fallback();
	// The URL has already changed to the list by now; the hero knows its slug.
	const slug = target.dataset.slug ?? '';
	const clone = document.createElement('div');
	clone.className = 'flip';
	clone.style.cssText = `left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px`;
	const copy = new Image();
	copy.src = img.currentSrc;
	copy.alt = '';
	copy.style.objectPosition = getComputedStyle(img).objectPosition;
	clone.appendChild(copy);
	document.body.appendChild(clone);
	returning = { clone, slug };
	// The list's first screen appears as it is, so the landing tile is there to land on.
	arriveSettled();
	await gsap.to(CONTAINER, { opacity: 0, duration: 0.25, ease: 'power1.inOut' });
}

/** On the list: shrink the pinned hero into the tile it came from. */
export async function unflipIn(fallback: () => Promise<void>) {
	const r = returning;
	returning = null;
	const tile = r ? document.querySelector<HTMLElement>(`a[data-flip][href="/projects/${r.slug}"]`) : null;
	if (!r || !tile) {
		r?.clone.remove();
		return fallback();
	}
	gsap.set(CONTAINER, { opacity: 0 });
	const cover = tile.querySelector<HTMLElement>('[data-flip-box]') ?? tile;
	// Bring the tile into view first if it is below the fold.
	let box = cover.getBoundingClientRect();
	if (box.bottom > window.innerHeight || box.top < 0) {
		window.scrollTo(0, window.scrollY + box.top - Math.max(0, (window.innerHeight - box.height) / 2));
		box = cover.getBoundingClientRect();
	}
	await gsap
		.timeline()
		.to(r.clone, { left: box.left, top: box.top, width: box.width, height: box.height, duration: 0.7, ease: 'expo.inOut' }, 0)
		.to(CONTAINER, { opacity: 1, duration: 0.4, ease: 'power1.inOut', clearProps: 'all' }, 0.25);
	r.clone.remove();
}
