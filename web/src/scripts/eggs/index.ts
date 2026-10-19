import { onTyped } from './keywords';
import { enableComic, disableComic, initComicShortcut } from './comic';

/**
 * Site-wide Easter eggs, once per full page load. Page-specific ones (Pong
 * on the 404, the dog at the bottom of Projects, Studio and Gallery) start
 * from page.ts. Typing "comic" anywhere turns on Comic Sans mode, "undo"
 * turns it off; Ctrl+Alt+C toggles it.
 */
export function initEggs() {
	onTyped('comic', enableComic);
	onTyped('undo', disableComic);
	initComicShortcut();
}
