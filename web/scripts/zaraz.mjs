/**
 * Cloudflare Zaraz on identityperth.com (README, Analytics). It runs GA4 for
 * the whole zone and, until launch, Clarity for the WordPress site. Both are
 * blocked on every other host in the zone and on the back ends (WordPress
 * admin and login, the Studio, the preview), set on 2 Nov.
 *
 *   node scripts/zaraz.mjs          prints the current set-up
 *   node scripts/zaraz.mjs launch   switches it to the new site: auto-inject
 *                                   off, so Zaraz loads only where SiteHead
 *                                   includes it, and the WordPress Clarity
 *                                   tool off, since the site loads its own
 *                                   Clarity project
 *
 * Needs the account token in .cloudflare-token at the repo root (gitignored).
 */
import { readFileSync } from 'node:fs';

const ZONE = '23aa063050c3ba3d3670ded5f5e19673'; // identityperth.com
const token = readFileSync(new URL('../../.cloudflare-token', import.meta.url), 'utf8').trim();

const api = async (method, body) => {
	const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE}/settings/zaraz/config`, {
		method,
		headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
		body: body ? JSON.stringify(body) : undefined,
	});
	const data = await res.json();
	if (!data.success) throw new Error(`Zaraz ${method} failed: ${JSON.stringify(data.errors)}`);
	return data.result;
};

const show = (config) => {
	console.log(`Auto-inject ${config.settings.autoInjectScript ? 'on' : 'off'}; page views on URL changes ${config.historyChange ? 'on' : 'off'}`);
	for (const tool of Object.values(config.tools)) {
		const blocked = (tool.blockingTriggers ?? []).map((id) => config.triggers[id]?.name ?? id).join(', ') || 'nothing';
		console.log(`${tool.enabled ? 'on ' : 'off'}  ${tool.name}, blocked by: ${blocked}`);
	}
};

let config = await api('GET');
if (process.argv[2] === 'launch') {
	config.settings.autoInjectScript = false;
	config.historyChange = false;
	for (const tool of Object.values(config.tools)) {
		if (tool.component === 'html' && /clarity/i.test(tool.name)) tool.enabled = false;
	}
	config = await api('PUT', config);
	console.log('Switched to the new site.');
}
show(config);
