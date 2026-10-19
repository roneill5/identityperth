import { toast } from './toast';

/**
 * Comic Sans mode. Type "comic" anywhere (or press Ctrl+Alt+C): every font
 * becomes Comic Sans, the logo turns into a scribble, and the cursor is a
 * pencil. Type "undo" to restore civilisation.
 */

export function enableComic() {
	if (document.documentElement.classList.contains('comic')) return;
	document.documentElement.classList.add('comic');
	toast({ title: 'Comic Sans mode. Type “undo” when you’ve had enough.', duration: 3600 });
}

export function disableComic() {
	if (!document.documentElement.classList.contains('comic')) return;
	document.documentElement.classList.remove('comic');
	toast({ title: 'Civilisation restored.', duration: 2200 });
}

export function initComicShortcut() {
	document.addEventListener('keydown', (e) => {
		if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'c') {
			e.preventDefault();
			if (document.documentElement.classList.contains('comic')) disableComic();
			else enableComic();
		}
	});
}
