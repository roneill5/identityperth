import { ScrollTrigger, reducedMotion } from './motion';
import { openDetails } from './accordion';

/**
 * Studio page. The photo column shows the studio's photos whatever is open,
 * except Team, which shows the portraits; in every other section nothing
 * moves by itself (Bel, 21 Oct). Team keeps its original behaviour (Bel,
 * 23 Oct): on desktop, opening a person drops their role and bio and
 * scrolls their portrait to the middle of the screen beside the list, and
 * scrolling the portraits past the middle of the screen opens the person
 * each one belongs to. Sections open only when clicked. Phones: every
 * section starts closed under a swipeable strip of the photos; opening one
 * folds the strip away so the text has the screen, closing the last brings
 * it back, and each person's portrait sits inside their bio. The strip never
 * swaps to the portraits: it did so as it folded, and they flashed (Ross,
 * 30 Oct).
 */
const DESKTOP = '(min-width: 64rem)';

export function initStudio(root: HTMLElement): () => void {
	const images = Array.from(root.querySelectorAll<HTMLElement>('[data-group]'));
	const portraits = images.filter((img) => img.dataset.opens);
	const sections = Array.from(root.querySelectorAll<HTMLDetailsElement>('details[data-section]'));
	const people = Array.from(root.querySelectorAll<HTMLDetailsElement>('details[data-item]'));
	const team = sections.find((d) => d.dataset.section === 'team');
	const mq = window.matchMedia(DESKTOP);
	if (!images.length || !sections.length) return () => {};
	const isOpen = (d?: HTMLDetailsElement) => Boolean(d?.open && !d.dataset.closing);

	// Phones: nothing open to start with, and the strip folds while reading.
	const strip = root.querySelector<HTMLElement>('[data-studio-images]');
	const fold = () => strip?.classList.toggle('is-folded', !mq.matches && sections.some(isOpen));
	if (!mq.matches) {
		sections.forEach((d) => {
			if (d.open) d.open = false;
		});
	}
	// Until now the page's open About panel was hidden on phones (global.css), so closing it moved nothing.
	root.classList.add('is-ready');

	// Opens started by a click scroll the page; the scroll sync stays out of the way until that scroll ends.
	let suppressed = false;
	let target = 0;
	let settle = 0;
	const release = () => {
		window.clearTimeout(settle);
		suppressed = false;
	};
	// Other scrolls (the trigger re-measure among them) also fire scrollend, so only arriving counts; the timer is the backstop.
	const onScrollEnd = () => {
		if (suppressed && Math.abs(window.scrollY - target) < 2) release();
	};
	const scrollTo = (top: number) => {
		const max = document.documentElement.scrollHeight - window.innerHeight;
		target = Math.round(Math.min(max, Math.max(0, top)));
		suppressed = true;
		window.scrollTo({ top: target, behavior: reducedMotion() ? 'auto' : 'smooth' });
		window.clearTimeout(settle);
		settle = window.setTimeout(release, 1500);
	};
	// ScrollTrigger scrolls to the top and back while it refreshes; ignore that too.
	let refreshing = false;
	const onRefreshInit = () => (refreshing = true);
	const onRefresh = () => (refreshing = false);
	ScrollTrigger.addEventListener('refreshInit', onRefreshInit);
	ScrollTrigger.addEventListener('refresh', onRefresh);

	/** The portraits while Team is open on desktop, the studio otherwise. */
	let shown = images.find((img) => !img.classList.contains('hidden'))?.dataset.group ?? 'about';
	const sync = () => {
		const group = mq.matches && isOpen(team) ? 'team' : 'about';
		if (group === shown || !images.some((img) => img.dataset.group === group)) return;
		shown = group;
		images.forEach((img) => img.classList.toggle('hidden', img.dataset.group !== group));
		if (strip) strip.scrollLeft = 0;
		// The portraits were hidden when their triggers were measured.
		ScrollTrigger.refresh();
	};
	const onSectionToggle = () =>
		window.setTimeout(() => {
			fold();
			sync();
		}, 0);
	sections.forEach((d) => d.addEventListener('toggle', onSectionToggle));
	sync();
	// Turning a tablet, or a desktop window shrinking: the strip and the column follow.
	const onMq = () => {
		fold();
		sync();
	};
	mq.addEventListener('change', onMq);

	// Scrolling a portrait through the middle of the screen opens that person.
	const triggers = portraits.map((img) =>
		ScrollTrigger.create({
			trigger: img,
			start: 'top 50%',
			end: 'bottom 50%',
			onToggle: (self) => {
				if (!self.isActive || !mq.matches || refreshing || suppressed || !isOpen(team)) return;
				const person = people.find((d) => d.dataset.item === img.dataset.opens);
				if (person) openDetails(person);
			},
		}),
	);

	// accordion.ts dispatches this when someone (not a script) opens an item.
	const onUserOpen = (e: Event) => {
		if (!mq.matches) return;
		const d = e.target as HTMLDetailsElement;
		if (d === team) {
			// Swap to the portraits now rather than on the toggle event: the swap
			// re-measures the triggers, which puts the old scroll position back
			// and would cancel this scroll. Then start at the first portrait.
			sync();
			scrollTo(0);
			return;
		}
		const img = portraits.find((p) => p.dataset.opens === d.dataset.item);
		if (!img) return;
		const rect = img.getBoundingClientRect();
		scrollTo(window.scrollY + rect.top - Math.max(0, (window.innerHeight - rect.height) / 2));
	};
	root.addEventListener('accordion:open', onUserOpen);
	window.addEventListener('scrollend', onScrollEnd);

	return () => {
		triggers.forEach((t) => t.kill());
		sections.forEach((d) => d.removeEventListener('toggle', onSectionToggle));
		mq.removeEventListener('change', onMq);
		strip?.classList.remove('is-folded');
		root.classList.remove('is-ready');
		ScrollTrigger.removeEventListener('refreshInit', onRefreshInit);
		ScrollTrigger.removeEventListener('refresh', onRefresh);
		root.removeEventListener('accordion:open', onUserOpen);
		window.removeEventListener('scrollend', onScrollEnd);
		window.clearTimeout(settle);
	};
}
