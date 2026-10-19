import { ScrollTrigger, reducedMotion } from './motion';
import { openDetails } from './accordion';

/**
 * Studio page: the photo column and the accordion stay in step on desktop.
 * Scrolling a photo through the middle of the viewport opens the section it
 * belongs to (`data-opens="team:<id>"` opens Team and that person); opening
 * a section by hand scrolls its first photo into the middle.
 */
const DESKTOP = '(min-width: 64rem)';

export function initStudio(root: HTMLElement): () => void {
	const images = Array.from(root.querySelectorAll<HTMLElement>('[data-opens]'));
	const sections = Array.from(root.querySelectorAll<HTMLDetailsElement>('details[data-section]'));
	const items = Array.from(root.querySelectorAll<HTMLDetailsElement>('details[data-item]'));
	const mq = window.matchMedia(DESKTOP);
	if (!images.length || !sections.length) return () => {};

	let suppressUntil = 0; // while a click-started scroll is in flight
	let settle = 0;

	// Opens made by the scroll sync are flagged so their toggle events are not
	// mistaken for clicks (which would scroll the column back to them).
	const byScroll = (d: HTMLDetailsElement) => {
		if (d.open && !d.dataset.closing) return;
		d.dataset.byScroll = '1';
		window.setTimeout(() => delete d.dataset.byScroll, 1000);
		openDetails(d);
	};
	const open = (target: string) => {
		const [section] = target.split(':');
		sections.forEach((d) => {
			if (d.dataset.section === section) byScroll(d);
		});
		items.forEach((d) => {
			if (d.dataset.item === target) byScroll(d);
		});
	};

	const triggers = images.map((el) =>
		ScrollTrigger.create({
			trigger: el,
			start: 'top 50%',
			end: 'bottom 50%',
			onToggle: (self) => {
				if (self.isActive && mq.matches && performance.now() > suppressUntil) open(el.dataset.opens!);
			},
		}),
	);

	const imageFor = (d: HTMLDetailsElement) => {
		const key = d.dataset.item ?? d.dataset.section ?? '';
		return images.find((img) => img.dataset.opens === key || (!d.dataset.item && img.dataset.opens?.startsWith(`${key}:`)));
	};

	const onToggle = (e: Event) => {
		const d = e.target as HTMLDetailsElement;
		if (d.dataset.byScroll) {
			delete d.dataset.byScroll;
			return;
		}
		if (!d.open || !mq.matches) return;
		const img = imageFor(d);
		if (!img) return;
		const rect = img.getBoundingClientRect();
		const top = window.scrollY + rect.top - Math.max(0, (window.innerHeight - rect.height) / 2);
		suppressUntil = Infinity;
		window.scrollTo({ top, behavior: reducedMotion() ? 'auto' : 'smooth' });
		window.clearTimeout(settle);
		settle = window.setTimeout(release, 1200);
	};
	const release = () => {
		window.clearTimeout(settle);
		if (suppressUntil === Infinity) suppressUntil = 0;
	};

	[...sections, ...items].forEach((d) => d.addEventListener('toggle', onToggle));
	window.addEventListener('scrollend', release);

	return () => {
		triggers.forEach((t) => t.kill());
		[...sections, ...items].forEach((d) => d.removeEventListener('toggle', onToggle));
		window.removeEventListener('scrollend', release);
		window.clearTimeout(settle);
	};
}
