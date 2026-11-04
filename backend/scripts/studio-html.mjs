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
 * 404ed at the site's root and left the CMS tab without an icon. The page
 * gets the site's own icon links instead (SiteHead.astro), so the CMS tab
 * shows exactly what the site's does in every browser; the manifest keeps
 * Sanity's link, prefixed, with the roundel PNGs from static/.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const file = new URL('../../web/public/backend/index.html', import.meta.url);
const KEY = 'sanityStudio:ui:colorScheme';
const tag = `<script>try{if(localStorage.getItem('${KEY}')!=='dark')localStorage.setItem('${KEY}','light')}catch(e){}</script>`;
const ICONS = '<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="icon" href="/icons/icon-32.png" type="image/png" sizes="32x32"><link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">';

let html = readFileSync(file, 'utf8');
if (!html.includes('<head>')) throw new Error('No <head> in the built Studio page');
if (!html.includes(KEY)) html = html.replace('<head>', `<head>${tag}`);
html = html.replace(/<link href="\/(?:backend\/)?static\/(?:favicon\.(?:ico|svg)|apple-touch-icon\.png)"[^>]*>/g, '');
html = html.replace(/(href=")\/static\//g, '$1/backend/static/');
if (!html.includes('/icons/icon-32.png')) html = html.replace('<head>', `<head>${ICONS}`);
writeFileSync(file, html);
console.log(`Studio page finished: light mode, ${(html.match(/rel="(?:icon|apple-touch-icon)"/g) ?? []).length} icon links, ${(html.match(/href="\/backend\/static\/manifest/g) ?? []).length} manifest`);
