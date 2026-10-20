import { ScrollTrigger, reducedMotion } from './motion';
import { openDetails } from './accordion';

/**
 * Studio page. Desktop: the photo column and the accordion stay in step.
 * Scrolling a photo through the middle of the viewport opens the section it
 * belongs to (`data-opens="team:<id>"` opens Team and that person); opening
 * a section by hand scrolls its first photo into the middle. Phones: every
 * section starts closed under a swipeable photo strip; opening one folds the
 * strip away so the text has the screen, closing the last brings it back.
 */
const DESKTOP = '(min-width: 64rem)';

export function initStudio(root: HTMLElement): () => void {
	const images = Array.from(root.querySelectorAll<HTMLElement>('[data-opens]'));
	const sections = Array.from(root.querySelectorAll<HTMLDetailsElement>('details[data-section]'));
	const items = Array.from(root.querySelectorAll<HTMLDetailsElement>('details[data-item]'));
	const mq = window.matchMedia(DESKTOP);
	if (!images.length || !sections.length) return () => {};

	// Phones: nothing open to start with, and the strip folds while reading.
	const strip = root.querySelector<HTMLElement>('[data-studio-images]');
	const fold = () => strip?.classList.toggle('is-folded', !mq.matches && sections.some((d) => d.open && !d.dataset.closing));
	if (!mq.matches) {
		sections.forEach((d) => {
			if (d.open) d.open = false;
		});
	}
	const onSectionToggle = () => window.setTimeout(fold, 0);
	sections.forEach((d) => d.addEventListener('toggle', onSectionToggle));

	let suppressUntil = 0; // while a click-started scroll is in flight
	let settle = 0;
	// ScrollTrigger scrolls to the top and back while it refreshes; ignore that.
	let refreshing = false;
	const onRefreshInit = () => (refreshing = true);
	const onRefresh = () => (refreshing = false);
	ScrollTrigger.addEventListener('refreshInit', onRefreshInit);
	ScrollTrigger.addEventListener('refresh', onRefresh);

	const open = (target: string) => {
		const [section] = target.split(':');
		sections.forEach((d) => {
			if (d.dataset.section === section) openDetails(d);
		});
		items.forEach((d) => {
			if (d.dataset.item === target) openDetails(d);
		});
	};

	const triggers = images.map((el) =>
		ScrollTrigger.create({
			trigger: el,
			start: 'top 50%',
			end: 'bottom 50%',
			onToggle: (self) => {
				if (self.isActive && mq.matches && !refreshing && performance.now() > suppressUntil) open(el.dataset.opens!);
			},
		}),
	);

	const imageFor = (d: HTMLDetailsElement) => {
		const key = d.dataset.item ?? d.dataset.section ?? '';
		return images.find((img) => img.dataset.opens === key || (!d.dataset.item && img.dataset.opens?.startsWith(`${key}:`)));
	};

	// Only people opening an item scroll the column to its photo (accordion.ts
	// dispatches this from clicks; the scroll sync's own opens never do).
	const onUserOpen = (e: Event) => {
		const d = e.target as HTMLDetailsElement;
		if (!mq.matches) return;
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

	root.addEventListener('accordion:open', onUserOpen);
	window.addEventListener('scrollend', release);

	return () => {
		triggers.forEach((t) => t.kill());
		sections.forEach((d) => d.removeEventListener('toggle', onSectionToggle));
		strip?.classList.remove('is-folded');
		ScrollTrigger.removeEventListener('refreshInit', onRefreshInit);
		ScrollTrigger.removeEventListener('refresh', onRefresh);
		root.removeEventListener('accordion:open', onUserOpen);
		window.removeEventListener('scrollend', release);
		window.clearTimeout(settle);
	};
}
