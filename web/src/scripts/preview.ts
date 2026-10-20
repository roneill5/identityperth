import { enableVisualEditing, type HistoryAdapterNavigate, type HistoryUpdate } from '@sanity/visual-editing';
import type Swup from 'swup';

/**
 * Loaded only on /preview pages (see app.ts). Turns on the Studio's visual
 * editing overlays, keeps the Studio's idea of the current URL in step with
 * Swup, and keeps every internal link inside the preview.
 */
const PREFIX = '/preview';
const toSite = (path: string) => path.replace(/^\/preview(?=\/|$)/, '') || '/';
const toPreview = (path: string) => (path === '/' ? PREFIX : PREFIX + path);

export function initPreview(swup: Swup) {
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
		history: {
			subscribe: (navigate: HistoryAdapterNavigate) => {
				const report = () => navigate({ type: 'push', url: toSite(location.pathname) + location.search });
				swup.hooks.on('page:view', report);
				report();
				return () => swup.hooks.off('page:view', report);
			},
			update: (update: HistoryUpdate) => {
				if (update.type === 'pop') return history.back();
				const url = toPreview(update.url);
				if (location.pathname + location.search !== url) void swup.navigate(url, { history: update.type });
			},
		},
	});
}
