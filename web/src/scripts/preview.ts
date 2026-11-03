import { enableVisualEditing, type HistoryAdapterNavigate, type HistoryUpdate } from '@sanity/visual-editing';
import { navigate } from 'astro:transitions/client';

/**
 * Loaded only on /preview pages (PreviewEditing.astro). Turns on the Studio's
 * visual editing overlays, keeps the Studio's idea of the current URL in step
 * with the client router, keeps every internal link inside the preview, and
 * re-renders the page as edits are saved.
 */
const PREFIX = '/preview';
const toSite = (path: string) => path.replace(/^\/preview(?=\/|$)/, '') || '/';
const toPreview = (path: string) => (path === '/' ? PREFIX : PREFIX + path);

// Live updates (Ross, 3 Nov): when an edit is saved in the Studio, the page is rendered again with the
// latest draft, once typing pauses, and opens where the editor was reading. A reload rather than a
// client-router swap, so the page transitions and the scroll hold stay out of it.
const SCROLL_KEY = 'idp-preview-scroll';
const PAUSE = 600; // ms after the last saved edit before the page re-renders
let refreshTimer = 0;

function restoreScroll() {
	let saved: string | null = null;
	try {
		saved = sessionStorage.getItem(SCROLL_KEY);
		sessionStorage.removeItem(SCROLL_KEY);
	} catch {
		return;
	}
	if (!saved) return;
	const [path, y] = JSON.parse(saved) as [string, number];
	if (path !== location.pathname) return;
	const go = () => requestAnimationFrame(() => window.scrollTo(0, y));
	if (document.readyState === 'complete') go();
	else addEventListener('load', go, { once: true });
}

function rerender(delay: number): Promise<void> {
	window.clearTimeout(refreshTimer);
	refreshTimer = window.setTimeout(() => {
		try {
			sessionStorage.setItem(SCROLL_KEY, JSON.stringify([location.pathname, window.scrollY]));
		} catch {
			// Private windows: the page still refreshes, at the top.
		}
		location.reload();
	}, delay);
	// The Studio shows its refreshing state until the reload replaces this page.
	return new Promise(() => {});
}

export function initPreview() {
	restoreScroll();

	document.addEventListener(
		'click',
		(e) => {
			const a = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="/"]');
			const href = a?.getAttribute('href') ?? '';
			if (!a || href.startsWith(PREFIX) || href.startsWith('/backend')) return;
			a.setAttribute('href', toPreview(href));
		},
		true,
	);

	enableVisualEditing({
		zIndex: 1000,
		refresh: (payload) => rerender(payload.source === 'manual' ? 0 : PAUSE),
		history: {
			subscribe: (report: HistoryAdapterNavigate) => {
				const tell = () => report({ type: 'push', url: toSite(location.pathname) + location.search });
				document.addEventListener('astro:page-load', tell);
				tell();
				return () => document.removeEventListener('astro:page-load', tell);
			},
			update: (update: HistoryUpdate) => {
				if (update.type === 'pop') return history.back();
				const url = toPreview(update.url);
				if (location.pathname + location.search !== url) void navigate(url, { history: update.type });
			},
		},
	});
}
