import { gsap, EASE, reducedMotion } from './motion';

/**
 * A heading that cycles through phrases one word at a time. Markup:
 *   <h2 data-cycle><span data-phrase>First.</span><span data-phrase aria-hidden="true">Second.</span></h2>
 * The phrases are stacked in one grid cell so the heading keeps the height
 * of its tallest phrase. Pauses while off screen; static when motion is
 * reduced or there is only one phrase.
 */
const HOLD_MS = 3400;

export function initCycle(el: HTMLElement): () => void {
	const phrases = Array.from(el.querySelectorAll<HTMLElement>('[data-phrase]'));
	if (phrases.length < 2 || reducedMotion()) return () => {};

	phrases.forEach((p) => {
		const words = (p.textContent ?? '').trim().split(/\s+/);
		p.innerHTML = words.map((w) => `<span class="cycle__word"><span>${w}</span></span>`).join(' ');
	});
	const inner = (p: HTMLElement) => Array.from(p.querySelectorAll<HTMLElement>('.cycle__word > span'));

	let current = 0;
	let timer = 0;
	let visible = true;
	let tl: gsap.core.Timeline | null = null;

	const show = (next: number) => {
		const from = phrases[current];
		const to = phrases[next];
		tl?.kill();
		tl = gsap
			.timeline()
			.to(inner(from), { yPercent: -110, duration: 0.45, ease: EASE.in, stagger: 0.035 })
			.set(from, { visibility: 'hidden' })
			.set(to, { visibility: 'visible' })
			.fromTo(inner(to), { yPercent: 110 }, { yPercent: 0, duration: 0.8, ease: EASE.out, stagger: 0.05 });
		from.setAttribute('aria-hidden', 'true');
		to.removeAttribute('aria-hidden');
		current = next;
	};

	const schedule = () => {
		window.clearTimeout(timer);
		timer = window.setTimeout(() => {
			if (visible && !document.hidden) show((current + 1) % phrases.length);
			schedule();
		}, HOLD_MS);
	};

	const observer = new IntersectionObserver(([entry]) => (visible = Boolean(entry?.isIntersecting)), { threshold: 0.4 });
	observer.observe(el);
	schedule();

	return () => {
		window.clearTimeout(timer);
		tl?.kill();
		observer.disconnect();
	};
}
