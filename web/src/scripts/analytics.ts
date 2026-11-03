/**
 * Analytics events. Google Analytics 4 gets them through Cloudflare Zaraz on
 * identityperth.com (SiteHead loads Zaraz's script there and nowhere else),
 * or through gtag when PUBLIC_GA_ID is set instead. Microsoft Clarity tags
 * its session recordings with the same event names, so recordings can be
 * filtered by what people did. On staging, the preview and the Studio none
 * of them load, and track() does nothing.
 *
 * GA4's own event and parameter names are used where it has them (click,
 * scroll, select_content, link_url, percent_scrolled, method), so its
 * standard reports pick them up. `area` and `label` are registered once in
 * GA4 as custom dimensions (README, Analytics).
 *
 *   page_view         every page, the client router's navigations included
 *   contact           an email or phone link: method (email, careers_email, phone), area
 *   click             a link to another site: link_url, link_domain, link_text, outbound, area
 *   select_content    a project card: content_type (project), content_id (the slug), area
 *   nav_click         any other link on the site: label, link_url, area
 *   menu_open         the Menu button: area
 *   showreel_advance  leaving the home showreel: method (scroll, swipe, key, click), seconds
 *   studio_section    a Studio section opened: label
 *   team_member       a person opened on Studio, from the list or a portrait: label, area
 *   service_open      a service opened on Studio: label
 *   scroll            25, 50, 75 and 90% of the way down a page: percent_scrolled
 *   page_not_found    the 404 (page_location holds the missing address)
 *   pong_start        the 404's game started
 *   pong_end          a game finished: label (won, lost)
 */

type Value = string | number | boolean;

declare global {
	interface Window {
		zaraz?: { track: (name: string, properties?: Record<string, Value>) => void; spaPageview?: () => void };
		gtag?: (...args: unknown[]) => void;
		clarity?: (...args: unknown[]) => void;
	}
}

export function track(name: string, params: Record<string, Value | null | undefined> = {}): void {
	const properties: Record<string, Value> = {};
	for (const [key, value] of Object.entries(params)) {
		if (value == null || value === '') continue;
		// 100 characters is GA4's limit for a parameter value.
		properties[key] = typeof value === 'string' ? value.slice(0, 100) : value;
	}
	try {
		if (window.zaraz?.track) window.zaraz.track(name, properties);
		else window.gtag?.('event', name, properties);
		window.clarity?.('event', name);
	} catch {
		// Analytics never gets in the way of the page.
	}
}

const words = (el: Element) => (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim();

/** Where on the site something was clicked: a piece of chrome, or else the kind of page. */
const areaOf = (el: Element): string => {
	if (el.closest('#menu')) return 'menu';
	if (el.closest('[data-bottom-bar]')) return 'bottom_bar';
	if (el.closest('[data-sidebar]')) return 'sidebar';
	if (el.closest('[aria-labelledby="next-project"]')) return 'next_project';
	if (el.closest('footer')) return 'footer';
	if (document.querySelector('[data-not-found]')) return '404';
	const [first, second] = location.pathname.replace(/^\/preview(?=\/|$)/, '').split('/').filter(Boolean);
	return !first ? 'home' : first === 'projects' && second ? 'project' : first;
};

const onClick = (e: MouseEvent) => {
	const target = e.target instanceof Element ? e.target : null;
	if (!target) return;

	const toggle = target.closest<HTMLElement>('[data-menu-toggle]');
	if (toggle) {
		if (toggle.getAttribute('aria-expanded') !== 'true') track('menu_open', { area: areaOf(toggle) });
		return;
	}

	// Accordions: counted as they open (this runs before accordion.ts toggles them).
	const summary = target.closest('summary');
	const details = summary?.parentElement;
	if (summary && details instanceof HTMLDetailsElement) {
		if (!details.open) {
			if (details.dataset.section) track('studio_section', { label: details.dataset.section });
			else if (details.dataset.item?.startsWith('team:')) track('team_member', { label: words(summary), area: 'list' });
			else if (details.dataset.item?.startsWith('services:')) track('service_open', { label: words(summary) });
		}
		return;
	}

	const portrait = target.closest<HTMLElement>('[data-opens]');
	if (portrait) {
		const person = document.querySelector(`details[data-item="${CSS.escape(portrait.dataset.opens ?? '')}"] > summary`);
		track('team_member', { label: person ? words(person) : null, area: 'portrait' });
		return;
	}

	const link = target.closest<HTMLAnchorElement>('a[href]');
	// The showreel's own link reports the exit itself (splash.ts), with how it happened.
	if (!link || link.matches('[data-advance-link]')) return;
	const href = link.getAttribute('href') ?? '';
	const area = areaOf(link);
	if (href.startsWith('mailto:')) return track('contact', { method: link.dataset.track ?? 'email', area });
	if (href.startsWith('tel:')) return track('contact', { method: 'phone', area });

	let url: URL;
	try {
		url = new URL(link.href);
	} catch {
		return;
	}
	if (!/^https?:$/.test(url.protocol)) return;
	if (url.origin !== location.origin) {
		return track('click', { link_url: url.href, link_domain: url.hostname, link_text: words(link), outbound: true, area });
	}
	if (url.pathname === location.pathname && url.hash) return; // a jump within the page
	const project = url.pathname.match(/^(?:\/preview)?\/projects\/([^/]+)\/?$/);
	if (project) return track('select_content', { content_type: 'project', content_id: project[1], area });
	track('nav_click', { label: words(link), link_url: url.pathname, area });
};

// Scroll depth, measured like the scroll line along the top: 0 at the top of the page, 100 at the bottom.
const MARKS = [25, 50, 75, 90];
let reached = new Set<number>();
let frame = 0;
const measure = () => {
	frame = 0;
	const room = document.documentElement.scrollHeight - window.innerHeight;
	if (room < 200) return; // pages that hardly scroll, like the showreel
	const percent = (window.scrollY / room) * 100;
	for (const mark of MARKS) {
		if (percent >= mark && !reached.has(mark)) {
			reached.add(mark);
			track('scroll', { percent_scrolled: mark });
		}
	}
};
const onScroll = () => (frame ||= requestAnimationFrame(measure));

// Zaraz counts the first page view itself; the client router's navigations are reported here.
let firstPage = true;
const onPageLoad = () => {
	reached = new Set();
	if (firstPage) {
		firstPage = false;
		return;
	}
	window.zaraz?.spaPageview?.();
};

let started = false;
export function initAnalytics(): void {
	if (started) return;
	started = true;
	document.addEventListener('click', onClick, { capture: true });
	window.addEventListener('scroll', onScroll, { passive: true });
	document.addEventListener('astro:page-load', onPageLoad);
}
