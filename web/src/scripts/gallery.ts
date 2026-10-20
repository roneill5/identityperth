import { gsap, reducedMotion } from './motion';

/**
 * Phone gallery: tapping a tile opens it in a panel above the bottom bar
 * with its caption, the page behind dimmed and blurred (Forth and Back's
 * archive pattern). Desktop keeps the hover caption and no panel.
 */
const DESKTOP = '(min-width: 64rem)';

export function initLightbox(root: HTMLElement): () => void {
	const mq = window.matchMedia(DESKTOP);
	let panel: HTMLElement | null = null;

	const close = () => {
		if (!panel) return;
		const el = panel;
		panel = null;
		document.documentElement.classList.remove('lightbox-open');
		if (reducedMotion()) el.remove();
		else gsap.to(el, { opacity: 0, duration: 0.1, onComplete: () => el.remove() });
	};

	const open = (src: string, caption: string) => {
		close();
		panel = document.createElement('div');
		panel.className = 'lightbox';
		panel.setAttribute('role', 'dialog');
		panel.setAttribute('aria-label', caption || 'Image');
		panel.innerHTML = `
			<button type="button" class="lightbox__close" aria-label="Close">
				<svg viewBox="0 0 14.4 14.4" width="24" height="24" fill="none" aria-hidden="true"><circle cx="7.2" cy="7.2" r="6.8" stroke="currentColor" stroke-width="0.8"/><path d="M3.91 3.91l6.58 6.58M10.49 3.91l-6.58 6.58" stroke="currentColor" stroke-width="0.98"/></svg>
			</button>
			<img class="lightbox__image" src="${src}" alt="" />
			${caption ? `<p class="lightbox__caption">${caption}</p>` : ''}`;
		document.body.appendChild(panel);
		document.documentElement.classList.add('lightbox-open');
		panel.querySelector('.lightbox__close')?.addEventListener('click', close);
		if (!reducedMotion()) gsap.fromTo(panel, { opacity: 0 }, { opacity: 1, duration: 0.15 });
	};

	const onClick = (e: Event) => {
		if (mq.matches) return;
		const figure = (e.target as HTMLElement).closest<HTMLElement>('[data-lightbox]');
		if (!figure?.dataset.lightbox) return;
		open(figure.dataset.lightbox, figure.dataset.caption ?? '');
	};
	const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();

	root.addEventListener('click', onClick);
	document.addEventListener('keydown', onKey);
	return () => {
		root.removeEventListener('click', onClick);
		document.removeEventListener('keydown', onKey);
		close();
	};
}
