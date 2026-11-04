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
// latest draft once typing pauses. Since 4 Nov the fresh render is swapped into the page in place
// (app.ts answers idp:preview-refresh) rather than reloaded, so nothing flashes, replays or scrolls
// away; the Studio's refreshing state ends when the swap has landed.
const PAUSE = 500; // ms after the last saved edit before the page re-renders
const FALLBACK = 8000; // ms for the swap to land before the page reloads instead
const SCROLL_KEY = 'idp-preview-scroll';
let refreshTimer = 0;
let fallbackTimer = 0;
const waiting: Array<() => void> = [];
document.addEventListener('idp:preview-refreshed', () => {
	window.clearTimeout(fallbackTimer);
	waiting.splice(0).forEach((done) => done());
});

// The legal pages' plain layout has no page container to swap (and no app.ts to do it): they reload,
// opening where the editor was reading. The same if a swap has not landed in time.
function reloadInPlace() {
	try {
		sessionStorage.setItem(SCROLL_KEY, JSON.stringify([location.pathname, window.scrollY]));
	} catch {
		// Private windows: the page still refreshes, at the top.
	}
	location.reload();
}

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
	return new Promise((resolve) => {
		waiting.push(resolve);
		refreshTimer = window.setTimeout(() => {
			if (!document.getElementById('page')) return reloadInPlace();
			document.dispatchEvent(new Event('idp:preview-refresh'));
			window.clearTimeout(fallbackTimer);
			fallbackTimer = window.setTimeout(reloadInPlace, FALLBACK);
		}, delay);
	});
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
