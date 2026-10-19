import { gsap, EASE, reducedMotion } from './motion';

/**
 * Animated <details>. Opening slides the panel down and fades it in; closing
 * slides it shut before the browser removes it. Inside one `[data-accordion]`
 * only one item is open at a time at any level: opening a section closes
 * the other sections (and whatever was open inside them), opening a person
 * closes the other people. Every change is interruptible: a panel still
 * sliding open can be told to close (and the reverse) and continues from
 * where it is, so a fast scroll through the Studio column never leaves two
 * items lit. Other scripts open items through `openDetails` so they animate.
 */
const DURATION = 0.45;
const CLEAR = 'height,opacity,overflow';

const panelOf = (d: HTMLDetailsElement) => d.querySelector<HTMLElement>(':scope > :not(summary)');

export function openDetails(d: HTMLDetailsElement) {
	if (d.open && !d.dataset.closing) return;
	// Everything else open in this accordion closes, except the chain above d.
	d.closest('[data-accordion]')?.querySelectorAll<HTMLDetailsElement>('details').forEach((other) => {
		if (other !== d && !other.contains(d) && !d.contains(other)) closeDetails(other);
	});
	const panel = panelOf(d);
	if (panel) gsap.killTweensOf(panel);
	// Mid-close: carry on from the current height instead of jumping to zero.
	const from = d.open && panel ? panel.offsetHeight : 0;
	delete d.dataset.closing;
	d.open = true;
	if (!panel) return;
	if (reducedMotion()) {
		gsap.set(panel, { clearProps: CLEAR });
		return;
	}
	gsap.fromTo(
		panel,
		{ height: from, opacity: from ? Number(panel.style.opacity || 1) : 0, overflow: 'hidden' },
		{ height: 'auto', opacity: 1, duration: DURATION, ease: EASE.out, clearProps: CLEAR },
	);
}

export function closeDetails(d: HTMLDetailsElement) {
	if (!d.open || d.dataset.closing) return;
	const panel = panelOf(d);
	if (!panel || reducedMotion()) {
		d.open = false;
		return;
	}
	gsap.killTweensOf(panel);
	d.dataset.closing = '1';
	const from = panel.offsetHeight;
	// Whatever is open inside shuts at once; the panel is measured already, so nothing jumps.
	d.querySelectorAll<HTMLDetailsElement>('details[open]').forEach((inner) => {
		const innerPanel = panelOf(inner);
		if (innerPanel) {
			gsap.killTweensOf(innerPanel);
			gsap.set(innerPanel, { clearProps: CLEAR });
		}
		delete inner.dataset.closing;
		inner.open = false;
	});
	gsap.fromTo(
		panel,
		{ height: from, overflow: 'hidden' },
		{
			height: 0,
			opacity: 0,
			duration: DURATION * 0.8,
			ease: EASE.in,
			onComplete: () => {
				d.open = false;
				delete d.dataset.closing;
				gsap.set(panel, { clearProps: CLEAR });
			},
		},
	);
}

/** Wire every details inside `root` (a `[data-accordion]` container). */
export function initAccordion(root: HTMLElement): () => void {
	const items = Array.from(root.querySelectorAll<HTMLDetailsElement>('details'));
	const onClick = (e: Event) => {
		const summary = (e.target as HTMLElement).closest('summary');
		const d = summary?.parentElement as HTMLDetailsElement | null;
		if (!summary || !d || !items.includes(d)) return;
		e.preventDefault();
		if (d.open && !d.dataset.closing) closeDetails(d);
		else openDetails(d);
	};
	root.addEventListener('click', onClick);
	return () => {
		root.removeEventListener('click', onClick);
		items.forEach((d) => {
			const panel = panelOf(d);
			if (panel) {
				gsap.killTweensOf(panel);
				gsap.set(panel, { clearProps: CLEAR });
			}
			delete d.dataset.closing;
		});
	};
}
