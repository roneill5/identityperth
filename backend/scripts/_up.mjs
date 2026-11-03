import { readFileSync } from 'node:fs';
import { getCliClient } from 'sanity/cli';
const token = getCliClient({ apiVersion: '2025-01-01' }).config().token;
const B = 'https://identityperth.com/backend/api/stream';
const call = async (label, path, init = {}, t = token) => { const r = await fetch(B + path, { ...init, headers: { ...(init.headers ?? {}), Authorization: `Bearer ${t}` } }); const d = await r.json().catch(() => ({})); console.log(label.padEnd(18), r.status, JSON.stringify(d).slice(0, 150)); return d; };
await call('no token', '/videos', {}, '');
await call('bad token', '/videos', {}, 'sk' + 'x'.repeat(40));
await call('bad uid', '/videos/not-a-uid');
const list = await call('list, search E61', '/videos?search=ID-E61');
console.log('   videos found:', list.videos?.length, '| first:', list.videos?.[0]?.name, list.videos?.[0]?.ready);
// A real upload through the same route the Studio uses.
const { uploadURL, uid } = await call('upload url', '/upload-url', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'ID test upload (delete me)' }) });
const form = new FormData();
form.append('file', new Blob([readFileSync('/private/tmp/claude-501/-Users-rossoneill-Local-Sites-identityperth/805acff7-e2a1-42a3-bfb1-141df09c0141/scratchpad/test-upload.mp4')], { type: 'video/mp4' }), 'test-upload.mp4');
const up = await fetch(uploadURL, { method: 'POST', body: form });
console.log('direct upload     ', up.status);
let state;
for (let i = 0; i < 20; i++) { state = await call('poll', `/videos/${uid}`); if (state.ready || state.error) break; await new Promise((r) => setTimeout(r, 4000)); }
const done = await call('mp4 requested', `/videos/${uid}`, { method: 'POST' });
console.log('RESULT uid', uid, '| ready', done.ready, '| size', done.width + 'x' + done.height, '| duration', done.duration);
console.log('TEST_UID=' + uid);
