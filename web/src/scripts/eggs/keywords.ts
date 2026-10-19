/**
 * Typed-word triggers. Keys typed anywhere on the page (not in form fields)
 * are buffered; when the buffer ends with a registered word its handler
 * runs. Modifier combos are ignored so shortcuts keep working.
 */

const handlers = new Map<string, () => void>();
let buffer = '';
let listening = false;

export function onTyped(word: string, handler: () => void) {
	handlers.set(word.toLowerCase(), handler);
	if (!listening) {
		listening = true;
		document.addEventListener('keydown', onKey);
	}
}

function onKey(e: KeyboardEvent) {
	if (e.metaKey || e.ctrlKey || e.altKey) return;
	const target = e.target as HTMLElement | null;
	if (target?.closest('input, textarea, select, [contenteditable]')) return;
	if (e.key.length !== 1) return;
	buffer = (buffer + e.key.toLowerCase()).slice(-32);
	for (const [word, handler] of handlers) {
		if (buffer.endsWith(word)) {
			buffer = '';
			// Stop the last letter landing in whatever the handler focuses.
			e.preventDefault();
			handler();
			return;
		}
	}
}
