// Writes public/_headers (gitignored) before the build: the security headers
// every response carries, cache lifetimes for the unhashed files in public/,
// and, away from the production domain, X-Robots-Tag: noindex so the staging
// address stays out of search even for images and files that have no
// <meta name="robots"> of their own. The Cloudflare adapter appends its own
// Cache-Control rule for the hashed /_astro/ files at build time.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const site = process.env.SITE_URL ?? 'https://identityperth.com';
const production = /^(www\.)?identityperth\.com$/.test(new URL(site).hostname);

// frame-ancestors 'self' lets the Studio at /backend show the site in its
// preview pane and keeps every other site from framing it. Scripts and
// styles are not restricted: Astro inlines small scripts, and the Studio
// under /backend has its own needs.
const security = [
	"Content-Security-Policy: frame-ancestors 'self'; base-uri 'self'; object-src 'none'; form-action 'self'",
	'X-Content-Type-Options: nosniff',
	'Referrer-Policy: strict-origin-when-cross-origin',
	'Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()',
	'Strict-Transport-Security: max-age=31536000',
	'Cross-Origin-Opener-Policy: same-origin-allow-popups',
];
const robots = production ? [] : ['X-Robots-Tag: noindex, nofollow'];

const block = (path, lines) => [path, ...lines.map((line) => `  ${line}`)].join('\n');
const text = [
	block('/*', [...security, ...robots]),
	// Clarity's player, on microsoft.com, fetches the fonts and any remaining hashed files at playback.
	block('/fonts/*', ['Cache-Control: public, max-age=31536000, immutable', 'Access-Control-Allow-Origin: *']),
	block('/_astro/*', ['Access-Control-Allow-Origin: *']),
	block('/og/*', ['Cache-Control: public, max-age=86400']),
	block('/icons/*', ['Cache-Control: public, max-age=604800']),
	block('/favicon.svg', ['Cache-Control: public, max-age=604800']),
	// Static .txt files go out as bare text/plain, which many fetchers read as Latin-1: curly apostrophes came out as "â€™".
	block('/llms.txt', ['Content-Type: text/plain; charset=utf-8']),
].join('\n\n');

mkdirSync(join(process.cwd(), 'public'), { recursive: true });
writeFileSync(join(process.cwd(), 'public/_headers'), `${text}\n`);
console.log(production ? 'headers: production build, indexable' : `headers: ${site} is not production, X-Robots-Tag: noindex on every response`);
