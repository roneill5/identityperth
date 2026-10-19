import confetti from 'canvas-confetti';
import { reducedMotion } from '../motion';

const COLOURS = ['#bdff3b', '#f2f2f2', '#64737a', '#1e1d1e'];

/** A burst from the middle of the screen. */
export function burst() {
	if (reducedMotion()) return;
	void confetti({ particleCount: 140, spread: 80, startVelocity: 45, origin: { y: 0.6 }, colors: COLOURS, zIndex: 95 });
	window.setTimeout(() => void confetti({ particleCount: 80, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors: COLOURS, zIndex: 95 }), 150);
	window.setTimeout(() => void confetti({ particleCount: 80, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors: COLOURS, zIndex: 95 }), 300);
}

/** The lottery-win version: cannons from both sides for a few seconds. */
export function celebrate(duration = 3000) {
	if (reducedMotion()) return;
	const end = Date.now() + duration;
	const frame = () => {
		void confetti({ particleCount: 6, angle: 60, spread: 55, origin: { x: 0, y: 0.8 }, colors: COLOURS, zIndex: 95 });
		void confetti({ particleCount: 6, angle: 120, spread: 55, origin: { x: 1, y: 0.8 }, colors: COLOURS, zIndex: 95 });
		if (Date.now() < end) requestAnimationFrame(frame);
	};
	frame();
	window.setTimeout(() => void confetti({ particleCount: 240, spread: 120, startVelocity: 55, origin: { y: 0.5 }, colors: COLOURS, zIndex: 95 }), 400);
}
