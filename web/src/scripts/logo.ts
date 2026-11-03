import { gsap, reducedMotion } from './motion';

/**
 * The logo reveal in the menu: the ID mark is there from the start, ENTITY
 * types itself out after it, E, N, T, I, T, Y, each letter simply appearing
 * 80 ms after the last, and the roundel pops in once the Y is down (Ross,
 * 29 Oct: a typewriter, nothing sliding or wiping). It is one GSAP
 * timeline: closing plays it backwards from wherever it is, last letter
 * first, quicker. The lockup never shrinks (Bel, 21 Oct). Reduced motion
 * jumps between states.
 *
 * Markup: a `.logo__inner` holding the mark and a `.logo__entity` around
 * the letter paths (`logo__letter`), with a `.logo__roundel` beside it.
 */

export interface LogoReveal {
	to(state: 'full' | 'id'): void;
	/** Jump to a state with no motion, e.g. resetting a closed menu. */
	set(state: 'full' | 'id'): void;
}

export function createLogoReveal(inner: HTMLElement): LogoReveal | null {
	const entity = inner.querySelector<HTMLElement>('.logo__entity');
	const letters = entity ? Array.from(entity.querySelectorAll<SVGElement>('.logo__letter')) : [];
	if (!entity || !letters.length) return null;
	// The roundel sits beside the lockup in the link, after the word.
	const roundel = inner.querySelector<SVGElement>('.logo__roundel') ?? inner.parentElement?.querySelector<SVGElement>('.logo__roundel') ?? null;

	gsap.set(letters, { opacity: 0 });
	if (roundel) gsap.set(roundel, { opacity: 0, scale: 0.6, transformOrigin: 'center center' });
	const STAGGER = 0.08;
	const reveal = gsap.timeline({ paused: true });
	// Typed: each letter is simply there, one keystroke after the last.
	letters.forEach((letter, i) => reveal.set(letter, { opacity: 1 }, 0.05 + i * STAGGER));
	if (roundel) reveal.to(roundel, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(2)' }, 0.05 + letters.length * STAGGER + 0.1);

	// The word is part of the link only while it is on screen: hidden letters must not be an invisible target.
	const touchable = (on: boolean) => {
		entity.style.pointerEvents = on ? 'auto' : '';
	};
	reveal.eventCallback('onReverseComplete', () => touchable(false));

	return {
		to(next) {
			if (reducedMotion()) return this.set(next);
			if (next === 'full') {
				touchable(true);
				reveal.timeScale(1).play();
			} else {
				reveal.timeScale(1.8).reverse();
			}
		},
		set(next) {
			reveal.pause();
			reveal.progress(next === 'full' ? 1 : 0);
			touchable(next === 'full');
		},
	};
}
