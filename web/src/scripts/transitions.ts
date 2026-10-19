import { gsap, reducedMotion } from './motion';

/**
 * Page transitions beyond the plain fade.
 *
 * Curtain: on the splash home page the ticker screen (an ink panel with the
 * ticker along its top edge) rises to cover the viewport, the new page is
 * swapped in underneath, and the panel keeps rising until it is gone. One
 * continuous movement, no fade to black in the middle.
 *
 * Flip: clicking a project tile (`a[data-flip]`) pins a copy of its cover
 * where it was, fades the old page, then grows the copy into the new page's
 * hero (`[data-flip-target]`) while the rest of the page fades in.
 */

const CONTAINER = '#swup';

// ---------- curtain ----------

let curtain: HTMLElement | null = null;

export async function curtainOut(fallback: () => Promise<void>) {
	const screen = document.querySelector<HTMLElement>('[data-ticker-screen]');
	if (!screen) return fallback();
	// Out of the container, so the content swap leaves it in place, and above
	// the sidebar so the logo only shows once the curtain has passed.
	document.body.appendChild(screen);
	screen.style.zIndex = '60';
	curtain = screen;
	const top = parseFloat(getComputedStyle(screen).top) || window.innerHeight;
	if (reducedMotion()) {
		gsap.set(screen, { y: -top });
		return;
	}
	await gsap.to(screen, { y: -top, duration: 0.7, ease: 'power3.inOut' });
}

export async function curtainIn(fallback: () => Promise<void>) {
	const screen = curtain;
	curtain = null;
	if (!screen) return fallback();
	gsap.set(CONTAINER, { clearProps: 'all' });
	const top = parseFloat(getComputedStyle(screen).top) || window.innerHeight;
	if (!reducedMotion()) {
		// A beat with the ticker along the top edge, then it carries on up.
		await gsap.to(screen, { y: -(top + screen.offsetHeight + 20), duration: 0.9, ease: 'power3.inOut', delay: 0.12 });
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
			// The tile's own box, not the zoomed image inside it: the copy must
			// never be larger than the hero it is heading for.
			const matrix = getComputedStyle(img).transform.match(/matrix\(([^,]+),/);
			pending = {
				src: img.currentSrc,
				position: getComputedStyle(img).objectPosition,
				rect: link.getBoundingClientRect(),
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
