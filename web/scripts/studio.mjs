// Puts the Studio bundle in public/backend before the site builds on Workers
// Builds (`npm run build:ci`, run from web/). The Studio only changes when
// something in backend/ does, and installing its 900 packages took 41 s of
// every build, content publishes included. So the built bundle (1 MB) is kept
// in node_modules/.astro, the one folder Workers Builds carries from build to
// build, under a hash of everything in backend/ that goes into it. Same hash:
// the bundle is copied back and backend/ is not installed at all. Any change
// in backend/ (schema, config, components, package-lock) is a new hash and a
// fresh install and build, as is a build with no cache. Sanity's own code is
// not in the bundle (auto-updates load it from Sanity's CDN), so a reused
// bundle is never behind on that.
//
// On a laptop, `npm run build` at the repo root always rebuilds the Studio.
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { join, relative } from 'node:path';

const web = process.cwd();
const backend = join(web, '..', 'backend');
const out = join(web, 'public', 'backend');
const store = join(web, 'node_modules', '.astro', 'studio');

// Not part of the bundle: dependencies (the lockfile stands for them), build leftovers and local seed data.
const SKIP = new Set(['node_modules', 'dist', '.sanity', 'seed', '.DS_Store']);

function files(dir) {
	return readdirSync(dir, { withFileTypes: true })
		.filter((entry) => !SKIP.has(entry.name) && !entry.name.endsWith('.tsbuildinfo'))
		.sort((a, b) => (a.name < b.name ? -1 : 1))
		.flatMap((entry) => (entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)]));
}

const hash = createHash('sha256');
for (const file of files(backend)) hash.update(relative(backend, file)).update('\0').update(readFileSync(file)).update('\0');
const key = hash.digest('hex').slice(0, 16);
const kept = join(store, key);

if (existsSync(join(kept, 'index.html'))) {
	rmSync(out, { recursive: true, force: true });
	cpSync(kept, out, { recursive: true });
	console.log(`studio: backend/ is unchanged (${key}), reusing the kept bundle`);
} else {
	console.log(`studio: no kept bundle for ${key}, installing and building`);
	const run = (command) => execSync(command, { cwd: backend, stdio: 'inherit' });
	run('npm install --no-audit --no-fund');
	run('npm run build');
	// One bundle is kept: an older one can never match again.
	rmSync(store, { recursive: true, force: true });
	mkdirSync(store, { recursive: true });
	cpSync(out, kept, { recursive: true });
	console.log(`studio: built and kept as ${key}`);
}
