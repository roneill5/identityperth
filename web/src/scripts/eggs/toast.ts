import { gsap, reducedMotion } from '../motion';

/**
 * Small notices that rise from the bottom of the screen (Comic Sans mode
 * uses them). One at a time, queued.
 */

interface ToastOptions {
	title: string;
	eyebrow?: string;
	duration?: number;
}

const queue: ToastOptions[] = [];
let showing = false;

export function toast(options: ToastOptions) {
	queue.push(options);
	if (!showing) next();
}

function next() {
	const options = queue.shift();
	if (!options) {
		showing = false;
		return;
	}
	showing = true;

	const el = document.createElement('div');
	el.className = 'egg-toast';
	el.setAttribute('role', 'status');
	el.innerHTML = `
		<span class="egg-toast__text">
			${options.eyebrow ? `<span class="egg-toast__eyebrow">${options.eyebrow}</span>` : ''}
			<span class="egg-toast__title">${options.title}</span>
		</span>`;
	document.body.appendChild(el);

	const hold = options.duration ?? 4200;
	const done = () => {
		el.remove();
		next();
	};

	if (reducedMotion()) {
		el.style.opacity = '1';
		window.setTimeout(done, hold);
		return;
	}

	gsap
		.timeline({ onComplete: done })
		.fromTo(el, { y: 48, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: 'back.out(1.4)' })
		.to(el, { y: 36, opacity: 0, duration: 0.35, ease: 'power2.in' }, `+=${hold / 1000}`);
}
