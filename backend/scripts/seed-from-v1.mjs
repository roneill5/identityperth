#!/usr/bin/env node
/**
 * Builds the Sanity import file for identityperth.com from:
 *   - the archived v1 site's project markdown and imagery (22 projects)
 *   - the real copy in content.mjs (Capability Statement, Brand Snapshot)
 *   - images pulled from the brand PDFs (team portraits, hero placeholder)
 *
 *   npm run seed:build      # writes seed/v1.ndjson
 *   npm run seed:import     # uploads documents and assets (--replace)
 *
 * Images and short videos are referenced by absolute file path, so the
 * import uploads them as assets. Every document has a stable _id, so
 * re-running overwrites the same documents and nothing else.
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LexoRank } from 'lexorank';
import {
	SERVICES,
	TEAM,
	TESTIMONIALS,
	CLIENT_WALL,
	CLIENT_ALIASES,
	DIFFERENCE,
	WHAT_CHANGES,
	COPY,
} from './content.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(here, '../..');
const V1 = process.env.V1_DIR ?? resolve(process.env.HOME, 'Sites/identityperth-v1');
const CONTENT = join(V1, 'src/content/projects');
const ASSETS = join(V1, 'src/assets/site');
const BRAND_IMAGES = join(REPO, 'research/brand/pdf-images');
const OUT = resolve(here, '../seed/v1.ndjson');
const MAX_VIDEO_BYTES = 8 * 1024 * 1024;

if (!existsSync(CONTENT)) {
	console.error(`Cannot find the v1 archive at ${V1}. Set V1_DIR if it lives elsewhere.`);
	process.exit(1);
}

// ---------- helpers ----------

let keyCounter = 0;
const key = () => `k${(++keyCounter).toString(36)}${Date.now().toString(36).slice(-3)}`;
const slugify = (s) =>
	s
		.toLowerCase()
		.replace(/&/g, 'and')
		.replace(/['’]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');

const fileAsset = (kind, path) => ({ _sanityAsset: `${kind}@file://${path}` });
const optionalImage = (path, alt) => (existsSync(path) ? { _type: 'figure', alt, ...fileAsset('image', path) } : undefined);

function block(text) {
	return {
		_type: 'block',
		_key: key(),
		style: 'normal',
		markDefs: [],
		children: [{ _type: 'span', _key: key(), text, marks: [] }],
	};
}

/** Minimal YAML front matter parser for the v1 files (strings, JSON arrays, numbers, one nested object). */
function parseFrontmatter(src) {
	const match = src.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
	if (!match) return { data: {}, body: src };
	const data = {};
	const lines = match[1].split('\n');
	let currentObject = null;
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (!line.trim()) continue;
		const nested = line.match(/^\s+([A-Za-z_]+):\s*(.*)$/);
		if (nested && currentObject) {
			data[currentObject][nested[1]] = parseValue(nested[2]);
			continue;
		}
		const top = line.match(/^([A-Za-z_]+):\s*(.*)$/);
		if (!top) continue;
		const [, k, v] = top;
		if (v === '') {
			// Either a JSON array spread over several indented lines, or a nested object.
			const next = lines[i + 1]?.trim() ?? '';
			if (next.startsWith('[')) {
				let json = '';
				let depth = 0;
				while (i + 1 < lines.length) {
					const part = lines[++i];
					json += part;
					depth += (part.match(/\[/g) ?? []).length - (part.match(/\]/g) ?? []).length;
					if (depth <= 0) break;
				}
				data[k] = parseValue(json);
				currentObject = null;
			} else {
				data[k] = {};
				currentObject = k;
			}
		} else {
			data[k] = parseValue(v);
			currentObject = null;
		}
	}
	return { data, body: match[2].trim() };
}

function parseValue(raw) {
	const v = raw.trim();
	if (v.startsWith('[') || v.startsWith('"')) {
		try {
			// Prettier-formatted YAML arrays carry a trailing comma, which JSON rejects.
			return JSON.parse(v.replace(/,\s*\]/g, ']'));
		} catch {
			return v.replace(/^"|"$/g, '');
		}
	}
	if (v === 'true') return true;
	if (v === 'false') return false;
	if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
	return v;
}

/** v1 service buckets -> the services in the Capability Statement. */
const SERVICE_MAP = {
	Brand: 'Brand & Identity',
	Web: 'Digital & Web',
	Campaign: 'Campaigns & Comms',
	Editorial: 'Content & Production',
	Packaging: 'Content & Production',
	Merch: 'Content & Production',
};

// ---------- build documents ----------

const docs = [];
const rank = { value: LexoRank.middle() };
const nextRank = () => {
	rank.value = rank.value.genNext();
	return rank.value.toString();
};

// Services
const serviceIds = new Map();
for (const [title, description] of SERVICES) {
	const _id = `service-${slugify(title)}`;
	serviceIds.set(title, _id);
	docs.push({ _id, _type: 'service', title, description, orderRank: nextRank() });
}

// Team. Portraits come from page 6 of the Capability Statement, in the same order.
const portraitFiles = existsSync(BRAND_IMAGES)
	? readdirSync(BRAND_IMAGES).filter((f) => f.startsWith('cap-p06-')).sort()
	: [];
TEAM.forEach(([name, role, bio], i) => {
	const portraitFile = portraitFiles[i] ? join(BRAND_IMAGES, portraitFiles[i]) : null;
	docs.push({
		_id: `team-${slugify(name)}`,
		_type: 'teamMember',
		name,
		role,
		bio,
		portrait: portraitFile ? optionalImage(portraitFile, `${name}, ${role} at Identity`) : undefined,
		orderRank: nextRank(),
	});
});

// Clients: the logo wall first, so project clients can map onto them.
const clientIds = new Map();
const clientFor = (name) => {
	const canonical = CLIENT_ALIASES[name] ?? name;
	let id = clientIds.get(canonical);
	if (!id) {
		id = `client-${slugify(canonical)}`;
		clientIds.set(canonical, id);
		docs.push({ _id: id, _type: 'client', name: canonical, orderRank: nextRank() });
	}
	return id;
};
CLIENT_WALL.forEach(clientFor);

// Testimonials
const testimonialIds = TESTIMONIALS.map((t) => {
	const _id = `testimonial-${slugify(t.name)}`;
	docs.push({
		_id,
		_type: 'testimonial',
		quote: t.quote,
		name: t.name,
		role: t.role,
		client: { _type: 'reference', _ref: clientFor(t.client) },
		orderRank: nextRank(),
	});
	return _id;
});

// Projects and gallery from the v1 archive
const files = readdirSync(CONTENT).filter((f) => f.endsWith('.md')).sort();
const projects = [];

for (const file of files) {
	const slug = file.replace(/\.md$/, '');
	const { data, body } = parseFrontmatter(readFileSync(join(CONTENT, file), 'utf8'));
	if (data.draft) continue;
	const folder = join(ASSETS, slug);
	if (!existsSync(folder)) {
		console.warn(`skip ${slug}: no asset folder`);
		continue;
	}
	projects.push({ slug, data, body, folder, order: data.order ?? 100, year: Number(data.year) || 0 });
}

// Newest first, then the manual order, matching the v1 archive.
projects.sort((a, b) => b.year - a.year || a.order - b.order);

for (const { slug, data, body, folder } of projects) {
	const clientName = data.client || data.title;
	const clientId = clientFor(clientName);

	const folderImages = readdirSync(folder).filter((f) => /\.(webp|jpe?g|png)$/i.test(f)).sort();
	if (data.gallery !== undefined && !Array.isArray(data.gallery)) {
		console.warn(`${slug}: could not read the gallery list, using the folder order`);
	}
	const images = (Array.isArray(data.gallery) ? data.gallery : folderImages).filter((f) => existsSync(join(folder, f)));
	const heroFile = data.heroImage && existsSync(join(folder, data.heroImage)) ? data.heroImage : images[0];
	if (!heroFile) {
		console.warn(`skip ${slug}: no images`);
		continue;
	}

	const altText = data.title === clientName ? data.title : `${data.title}, ${clientName}`;
	const figure = (file, alt) => ({ _type: 'figure', _key: key(), alt, ...fileAsset('image', join(folder, file)) });
	const media = (file) => ({ _type: 'media', _key: key(), kind: 'image', image: figure(file, altText) });

	// Body: intro text, then the gallery as full-width and paired blocks.
	const bodyBlocks = [];
	const paragraphs = body.split(/\n\s*\n/).map((p) => p.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean);
	if (paragraphs.length > 1) {
		bodyBlocks.push({ _type: 'textBlock', _key: key(), heading: 'The brief', body: paragraphs.slice(1).map(block) });
	}
	const rest = images.filter((f) => f !== heroFile);
	const shapes = ['square', 'portrait', 'landscape'];
	let pairCount = 0;
	for (let i = 0; i < rest.length; ) {
		if (i % 3 === 0 || i === rest.length - 1) {
			bodyBlocks.push({ _type: 'mediaFull', _key: key(), media: media(rest[i]) });
			i += 1;
		} else {
			bodyBlocks.push({
				_type: 'mediaPair',
				_key: key(),
				shape: shapes[pairCount++ % shapes.length],
				left: media(rest[i]),
				right: media(rest[i + 1]),
			});
			i += 2;
		}
	}
	if (data.quote?.text) {
		bodyBlocks.splice(Math.min(2, bodyBlocks.length), 0, {
			_type: 'quote',
			_key: key(),
			text: data.quote.text,
			attribution: [data.quote.author, data.quote.role].filter(Boolean).join(', '),
		});
	}

	// Optional short hero loop from the v1 public/video folder.
	}

	const services = [...new Set((data.services ?? []).map((s) => SERVICE_MAP[s]).filter(Boolean))].map((title) => ({
		_type: 'reference',
		_key: key(),
		_ref: serviceIds.get(title),
	}));

	const projectId = `project-${slug}`;
	docs.push({
		_id: projectId,
		_type: 'project',
		title: data.title,
		slug: { _type: 'slug', current: slug },
		client: { _type: 'reference', _ref: clientId },
		tagline: paragraphs[0] && paragraphs[0].length <= 90 ? paragraphs[0] : undefined,
		summary: data.blurb?.replace(/…$/, '.') || paragraphs[0] || data.title,
		cover: figure(heroFile, altText),
		year: Number(data.year) || undefined,
		services,
		body: bodyBlocks,
		orderRank: nextRank(),
	});

	// Two gallery tiles per project so the Gallery page has a wall to show.
	for (const file of images.slice(0, 2)) {
		docs.push({
			_id: `gallery-${slug}-${slugify(file.replace(/\.\w+$/, ''))}`,
			_type: 'galleryItem',
			image: figure(file, altText),
			project: { _type: 'reference', _ref: projectId },
			orderRank: nextRank(),
		});
	}
}

// Studio photography from the v1 shoot folder, if present.
const shoot = join(ASSETS, '_photoshoot');
const studioImages = existsSync(shoot)
	? readdirSync(shoot)
			.filter((f) => /\.(webp|jpe?g|png)$/i.test(f))
			.sort()
			.slice(0, 6)
			.map((f) => ({ _type: 'figure', _key: key(), alt: 'Inside the Identity studio', ...fileAsset('image', join(shoot, f)) }))
	: [];

// ---------- singletons ----------

docs.push({
	_id: 'siteSettings',
	_type: 'siteSettings',
	siteName: 'Identity',
	tagline: COPY.tagline,
	menuText: COPY.menuText,
	careersEmail: 'careers@identityperth.com',
	phone: '+61 8 6255 8629',
	address: '5/15 Vanden Way,\nJoondalup, Perth\nWA 6027',
	socials: [
		{ _type: 'social', _key: key(), label: 'instagram', url: 'https://www.instagram.com/identityperth/' },
		{ _type: 'social', _key: key(), label: 'facebook', url: 'https://www.facebook.com/identityperth/' },
		{ _type: 'social', _key: key(), label: 'linkedin', url: 'https://www.linkedin.com/company/identity-perth/' },
	],
	seo: {
		_type: 'seo',
		title: 'Identity | Strategic and creative partner, Perth',
		description: COPY.seoDescription,
	},
});

// Hero: the skater image from the Cap Stat as a placeholder for the showreel, then project covers.
const skater = join(BRAND_IMAGES, 'cap-p09-1-1578x889.png');
const heroSlides = [
	optionalImage(skater, 'Skateboarder in motion, black and white'),
	...projects.slice(0, 5).map((p) => {
		const file = p.data.heroImage && existsSync(join(p.folder, p.data.heroImage)) ? p.data.heroImage : '01.webp';
		return optionalImage(join(p.folder, file), p.data.title === p.data.client ? p.data.title : `${p.data.title}, ${p.data.client}`);
	}),
]
	.filter(Boolean)
	.map((image) => ({ _type: 'media', _key: key(), kind: 'image', image: { ...image, _key: key() } }));

const points = (items) => items.map(([title, text]) => ({ _type: 'point', _key: key(), title, text }));

docs.push({
	_id: 'home',
	_type: 'home',
	heroImage: heroSlides[0]?.image ?? null,
	ticker: COPY.ticker,
	seo: { _type: 'seo', description: COPY.seoDescription },
});

docs.push({
	_id: 'studio',
	_type: 'studio',
	aboutHeading: COPY.aboutHeading,
	aboutHeadings: COPY.ticker,
	aboutBody: COPY.aboutBody.map(block),
	aboutHighlights: COPY.aboutHighlights,
	clientsIntro: COPY.clientsHeading,
	// The column follows the accordion: About, (services and portraits come from their documents), Clients, Contact.
	images: studioImages.slice(0, 2),
	clientsImages: studioImages.slice(2, 4),
	contactImages: studioImages.slice(4, 6),
	seo: { _type: 'seo', description: COPY.clearerBody.split('. ')[0] + '.' },
});

// ---------- write ----------

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, docs.map((doc) => JSON.stringify(doc)).join('\n') + '\n');

const counts = docs.reduce((acc, d) => ((acc[d._type] = (acc[d._type] ?? 0) + 1), acc), {});
console.log(`Wrote ${docs.length} documents to ${OUT}`);
console.table(counts);
