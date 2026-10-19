import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Shared easings, mirrored in global.css. */
export const EASE = {
	out: 'expo.out',
	in: 'power2.in',
	inOut: 'power3.inOut',
} as const;
