import { readFileSync, statSync, openSync, readSync, closeSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { getCliClient } from 'sanity/cli';

/**
 * Uploads videos to Cloudflare Stream and points the CMS at them:
 *   STREAM_TOKEN=... npx sanity exec scripts/stream-videos.mjs --with-user-token -- manifest.json [--account <id>]
 * STREAM_TOKEN is a Cloudflare API token with Stream: Edit on the account
 * that has Stream (never commit it). The manifest is a JSON list of
 *   { "file": "showreel.mp4", "name": "Identity showreel", "targets": [{ "doc": "home", "field": "heroVideo" }] }
 *   { "file": "dam-1.mp4", "name": "The DAM 1", "targets": [{ "doc": "project-x", "video": "cover.video" }] }
 * with files relative to the manifest. "field" sets a plain Stream ID field;
 * "video" sets a video object's streamId. A
 * video already on Stream under the same name is reused, not uploaded again.
 */
const args = process.argv.slice(2);
const manifestPath = args.find((a) => a.endsWith('.json'));
const token = process.env.STREAM_TOKEN;
if (!manifestPath || !token) {
	console.error('usage: STREAM_TOKEN=... npx sanity exec scripts/stream-videos.mjs --with-user-token -- manifest.json [--account <id>]');
	process.exit(1);
}
const api = 'https://api.cloudflare.com/client/v4';
const auth = { Authorization: `Bearer ${token}` };
const cf = async (path, init = {}) => {
	const res = await fetch(`${api}${path}`, { ...init, headers: { ...auth, ...(init.headers ?? {}) } });
	const json = await res.json().catch(() => ({}));
	if (!res.ok || json.success === false) throw new Error(`${init.method ?? 'GET'} ${path}: ${res.status} ${JSON.stringify(json.errors ?? json)}`);
	return json.result;
};

// The account: --account, or the only one this token can see.
let account = args[args.indexOf('--account') + 1];
if (!args.includes('--account')) {
	const accounts = await cf('/accounts');
	if (accounts.length !== 1) throw new Error(`The token sees ${accounts.length} accounts; pass --account <id> (${accounts.map((a) => `${a.id} ${a.name}`).join(', ')})`);
	account = accounts[0].id;
}
console.log(`Stream account ${account}`);

const MB = 1024 * 1024;
async function upload(file, name) {
	const size = statSync(file).size;
	const meta = `name ${Buffer.from(name).toString('base64')},requiresignedurls ${Buffer.from('false').toString('base64')}`;
	if (size < 190 * MB) {
		const form = new FormData();
		form.append('file', new Blob([readFileSync(file)], { type: 'video/mp4' }), basename(file));
		const result = await cf(`/accounts/${account}/stream`, { method: 'POST', body: form });
		return result.uid;
	}
	// Large files go up in pieces (tus): create, then send 50 MB at a time.
	const create = await fetch(`${api}/accounts/${account}/stream`, {
		method: 'POST',
		headers: { ...auth, 'Tus-Resumable': '1.0.0', 'Upload-Length': String(size), 'Upload-Metadata': meta },
	});
	const location = create.headers.get('location');
	if (!create.ok || !location) throw new Error(`tus create failed: ${create.status} ${await create.text()}`);
	const fd = openSync(file, 'r');
	const chunk = 50 * MB;
	for (let offset = 0; offset < size; offset += chunk) {
		const length = Math.min(chunk, size - offset);
		const buf = Buffer.alloc(length);
		readSync(fd, buf, 0, length, offset);
		const res = await fetch(location, {
			method: 'PATCH',
			headers: { ...auth, 'Tus-Resumable': '1.0.0', 'Upload-Offset': String(offset), 'Content-Type': 'application/offset+octet-stream' },
			body: buf,
		});
		if (!res.ok) throw new Error(`tus chunk at ${offset} failed: ${res.status} ${await res.text()}`);
		console.log(`  ${name}: ${Math.round(((offset + length) / size) * 100)}%`);
	}
	closeSync(fd);
	return create.headers.get('stream-media-id') ?? location.split('/').pop().split('?')[0];
}

const sanity = getCliClient({ apiVersion: '2025-08-04' });
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const existing = await cf(`/accounts/${account}/stream?limit=1000`);
for (const item of manifest) {
	const file = resolve(dirname(manifestPath), item.file);
	let uid = existing.find((v) => v.meta?.name === item.name)?.uid;
	if (uid) console.log(`${item.name}: already on Stream (${uid})`);
	else {
		console.log(`${item.name}: uploading ${basename(file)} (${Math.round(statSync(file).size / MB)} MB)`);
		uid = await upload(file, item.name);
	}
	// Public playback, named for the dashboard.
	await cf(`/accounts/${account}/stream/${uid}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ uid, requireSignedURLs: false, meta: { name: item.name } }) });
	for (let i = 0; i < 120; i++) {
		const video = await cf(`/accounts/${account}/stream/${uid}`);
		if (video.readyToStream) break;
		if (video.status?.state === 'error') throw new Error(`${item.name}: Stream could not process it (${video.status.errReasonText})`);
		if (i === 119) throw new Error(`${item.name}: still processing after 10 minutes`);
		await new Promise((r) => setTimeout(r, 5000));
	}
	// The whole video as one MP4 as well: covers play that (web/src/lib/video.ts, mp4Url).
	await cf(`/accounts/${account}/stream/${uid}/downloads`, { method: 'POST' });
	console.log(`${item.name}: ready (${uid}), MP4 requested`);
	for (const t of item.targets) {
		for (const id of [t.doc, `drafts.${t.doc}`]) {
			if (!(await sanity.getDocument(id))) continue;
			const patch = sanity.patch(id).set(t.field ? { [t.field]: uid } : { [`${t.video}.streamId`]: uid });
			await patch.commit();
			console.log(`  set on ${id} ${t.field ?? t.video}`);
		}
	}
}
console.log('Done. Rebuild and deploy the site to show them.');
