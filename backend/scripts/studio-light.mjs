/**
 * Opens the built Studio in light mode (Ross, 3 Nov). Sanity keeps the
 * Appearance choice per browser and starts on the computer's own setting, so
 * on a dark Mac the Studio was dark; there is no config option to change the
 * starting point. This writes one line into the built index page, run after
 * `sanity build` (package.json): before the Studio starts, the stored choice
 * becomes light unless the editor picked Dark in the Appearance menu.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const file = new URL('../../web/public/backend/index.html', import.meta.url);
const KEY = 'sanityStudio:ui:colorScheme';
const tag = `<script>try{if(localStorage.getItem('${KEY}')!=='dark')localStorage.setItem('${KEY}','light')}catch(e){}</script>`;

let html = readFileSync(file, 'utf8');
if (html.includes(KEY)) {
	console.log('Studio already opens in light mode');
} else {
	if (!html.includes('<head>')) throw new Error('No <head> in the built Studio page');
	html = html.replace('<head>', `<head>${tag}`);
	writeFileSync(file, html);
	console.log('Studio set to open in light mode');
}
