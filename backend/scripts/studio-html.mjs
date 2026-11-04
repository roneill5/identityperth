/**
 * Finishes the built Studio page, run after `sanity build` (package.json):
 *
 * Light mode (Ross, 3 Nov). Sanity keeps the Appearance choice per browser
 * and starts on the computer's own setting, so on a dark Mac the Studio was
 * dark; there is no config option to change the starting point. One line
 * before the Studio starts makes the stored choice light unless the editor
 * picked Dark in the Appearance menu.
 *
 * Icon links (Ross, 4 Nov). The build prefixes its scripts with the base
 * path from sanity.cli.ts but not its favicon and manifest links, which then
 * 404ed at the site's root and left the CMS tab without an icon. The icons
 * are the site's own, from static/.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const file = new URL('../../web/public/backend/index.html', import.meta.url);
const KEY = 'sanityStudio:ui:colorScheme';
const tag = `<script>try{if(localStorage.getItem('${KEY}')!=='dark')localStorage.setItem('${KEY}','light')}catch(e){}</script>`;

let html = readFileSync(file, 'utf8');
if (!html.includes('<head>')) throw new Error('No <head> in the built Studio page');
if (!html.includes(KEY)) html = html.replace('<head>', `<head>${tag}`);
html = html.replace(/(href=")\/static\//g, '$1/backend/static/');
writeFileSync(file, html);
console.log(`Studio page finished: light mode, ${(html.match(/href="\/backend\/static\//g) ?? []).length} icon links`);
