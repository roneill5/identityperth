// Renders the share images (Open Graph, 1200 x 630) for every page before the
// site builds, into public/og/ (gitignored), so they ship as static files:
//   og/home.png, og/projects.png, og/studio.png, og/gallery.png, og/default.png,
//   og/projects/<slug>.png and og/<legal slug>.png.
// Base.astro links each page to its card unless a share image is set in the CMS.
// Layout: a 50/50 split (Ross, 30 Oct): on the left the ID mark and a label up
// top with the title in Shippori Mincho and a line under it at the foot; on the
// right the page's picture full-bleed (the home card and a project with a video
// cover show the video's first frame, from Stream, the same poster the site
// shows; Ross, 2 Nov); the lime ticker bar along the bottom. Run on
// its own with `npm run og` from web/.
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { createClient } from '@sanity/client';
import { createImageUrlBuilder } from '@sanity/image-url';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const W = 1200;
const H = 630;
const BAR = 56;
const INK = '#1e1d1e';
const PAPER = '#f2f2f2';
const LIME = '#bdff3b';
const SLATE = '#64737a';

const root = process.cwd();
const out = join(root, 'public/og');
// Start clean: a card for a project that has since been deleted would otherwise ship forever.
rmSync(out, { recursive: true, force: true });
const client = createClient({ projectId: 't2bz0tb2', dataset: 'production', apiVersion: '2025-01-01', useCdn: false, perspective: 'published' });
const urlFor = (source) => createImageUrlBuilder(client).image(source);
const STREAM_HOST = 'https://customer-16n3ytiw02tgly9e.cloudflarestream.com';

const font = (file) => readFileSync(join(root, file));
const fonts = [
	{ name: 'serif', data: font('node_modules/@fontsource/shippori-mincho/files/shippori-mincho-latin-400-normal.woff'), weight: 400, style: 'normal' },
	{ name: 'sans', data: font('node_modules/@fontsource/figtree/files/figtree-latin-500-normal.woff'), weight: 500, style: 'normal' },
	{ name: 'display', data: font('public/fonts/hansief.otf'), weight: 400, style: 'normal' },
];

/** A brand SVG as a data URI in the given colour. */
const brand = (file, color) => {
	const svg = readFileSync(join(root, 'src/assets/brand', file), 'utf8').replace(/currentColor/g, color);
	return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
};
const marks = {
	idLime: brand('id-mark.svg', LIME),
	idInk: brand('id-mark.svg', INK),
	entityLime: brand('entity.svg', LIME),
	entityInk: brand('entity.svg', INK),
	roundelInk: brand('roundel.svg', INK),
};
/** The IDENTITY lockup at a given height: the ID mark, the site's spacer, then the ENTITY letters. */
const img = (src, width, height, style = {}) => ({ type: 'img', props: { src, width, height, style: { width, height, ...style } } });
const wordmark = (height, color) => {
	const id = Math.round((105.417 / 99.329) * height);
	const gap = Math.round((21 / 99) * height);
	const entity = Math.round((419.194 / 98.437) * height);
	return h('div', { display: 'flex', flexDirection: 'row', alignItems: 'center' }, [
		img(color === INK ? marks.idInk : marks.idLime, id, height),
		img(color === INK ? marks.entityInk : marks.entityLime, entity, Math.round((98.437 / 99.329) * height), { marginLeft: gap }),
	]);
};

const imageCache = new Map();
/** A Sanity image, cropped around its hotspot to the panel, as a JPEG data URI. */
async function picture(image, width, height) {
	if (!image?.asset) return null;
	return fetchImage(urlFor(image).width(width).height(height).fit('crop').format('jpg').quality(82).url());
}
/** A Stream video's first frame (the poster the site itself shows), cropped to the panel. */
async function frame(streamId, width, height) {
	if (!/^[a-f0-9]{32}$/i.test(streamId ?? '')) return null;
	return fetchImage(`${STREAM_HOST}/${streamId}/thumbnails/thumbnail.jpg?time=0s&width=${width}&height=${height}&fit=crop`);
}
async function fetchImage(url) {
	if (!imageCache.has(url)) {
		const res = await fetch(url);
		if (!res.ok) throw new Error(`${res.status} fetching ${url}`);
		imageCache.set(url, `data:image/jpeg;base64,${Buffer.from(await res.arrayBuffer()).toString('base64')}`);
	}
	return imageCache.get(url);
}

const h = (type, style, children, extra = {}) => ({ type, props: { style, children, ...extra } });
const text = (value, style) => h('div', style, value);
const label = (value) => text(value.toUpperCase(), { fontFamily: 'display', fontSize: 22, letterSpacing: 3, color: LIME, lineHeight: 1 });
const titleSize = (value) => (value.length <= 14 ? 80 : value.length <= 24 ? 64 : value.length <= 40 ? 52 : 44);

function card({ label: labelText, title, subtitle, images = [], wordmark: useWordmark = false }) {
	const panel = images.length > 0;
	const leftWidth = panel ? W / 2 : W;
	const panelWidth = W - leftWidth;
	const panelHeight = H - BAR;

	// satori sizes boxes content-box: width and height exclude the padding.
	const pad = 56;
	const heading = useWordmark
		? wordmark(88, LIME)
		: text(title, { fontFamily: 'serif', fontSize: titleSize(title), lineHeight: 1.08, color: PAPER, maxWidth: leftWidth - 2 * pad, textWrap: 'balance' });

	const left = h('div', { width: leftWidth - 2 * pad, height: panelHeight - 2 * pad, padding: pad, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }, [
		h('div', { display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, [
			img(marks.idLime, 55, 52),
			label(labelText),
		]),
		h('div', { display: 'flex', flexDirection: 'column' }, [
			heading,
			subtitle ? text(subtitle, { fontFamily: 'sans', fontSize: 27, lineHeight: 1.35, color: PAPER, opacity: 0.72, marginTop: 22, maxWidth: leftWidth - 2 * pad }) : null,
		].filter(Boolean)),
	]);

	let right = null;
	if (images.length === 1) {
		right = h('div', { width: panelWidth, height: panelHeight, display: 'flex', overflow: 'hidden', backgroundColor: SLATE }, [
			img(images[0], panelWidth, panelHeight, { objectFit: 'cover' }),
		]);
	} else if (images.length > 1) {
		const cw = panelWidth / 2;
		const ch = panelHeight / 2;
		const rows = [images.slice(0, 2), images.slice(2, 4)].filter((row) => row.length);
		right = h('div', { width: panelWidth, height: panelHeight, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: SLATE }, rows.map((row) =>
			h('div', { display: 'flex', flexDirection: 'row', width: panelWidth, height: ch }, row.map((src) => img(src, cw, ch, { objectFit: 'cover' }))),
		));
	}

	const bar = h('div', { width: W - 2 * pad, height: BAR, backgroundColor: LIME, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: pad, paddingRight: pad }, [
		h('div', { display: 'flex', flexDirection: 'row', alignItems: 'center' }, [
			wordmark(20, INK),
			img(marks.roundelInk, 22, 22, { marginLeft: 18 }),
			text('PERTH, WA', { fontFamily: 'display', fontSize: 20, letterSpacing: 2.4, color: INK, marginLeft: 18, lineHeight: 1 }),
		]),
		text('IDENTITYPERTH.COM', { fontFamily: 'display', fontSize: 20, letterSpacing: 2.4, color: INK, lineHeight: 1 }),
	]);

	return h('div', { width: W, height: H, display: 'flex', flexDirection: 'column', backgroundColor: INK, fontFamily: 'sans' }, [
		h('div', { display: 'flex', flexDirection: 'row', width: W, height: panelHeight }, [left, right].filter(Boolean)),
		bar,
	]);
}

async function render(file, props) {
	const svg = await satori(card(props), { width: W, height: H, fonts });
	const png = new Resvg(svg, { fitTo: { mode: 'width', value: W }, font: { loadSystemFonts: false } }).render().asPng();
	const path = join(out, `${file}.png`);
	mkdirSync(join(path, '..'), { recursive: true });
	writeFileSync(path, png);
	return path;
}

const data = await client.fetch(`{
  "settings": *[_id == "siteSettings"][0]{ tagline },
  "home": *[_id == "home"][0]{ heroVideo },
  "studio": *[_id == "studio"][0]{ aboutHeading, "images": images[0...4] },
  "projects": *[_type == "project"] | order(orderRank){ title, "slug": slug.current, tagline, "client": client->name, "video": select(cover.kind == "video" => cover.video.streamId), "image": coalesce(cover.image, body[_type == "mediaFull" && media.kind == "image"][0].media.image, body[_type == "mediaPair" && left.kind == "image"][0].left.image) },
  "gallery": *[_type == "galleryItem"] | order(orderRank)[0...4]{ image },
  "legal": *[_type == "legalPage" && defined(slug.current)]{ title, "slug": slug.current }
}`);
const site = 'Identity';
const tagline = data.settings?.tagline ?? '';
const panel = (image) => picture(image, 600, H - BAR);
const cell = (image) => picture(image, 300, Math.round((H - BAR) / 2));
const cells = async (items) => (await Promise.all(items.map((item) => cell(item?.image ?? item)))).filter(Boolean);

const jobs = [
	['home', { label: `${site} Perth`, title: site, subtitle: tagline, wordmark: true, images: [await frame(data.home?.heroVideo, 600, H - BAR)].filter(Boolean) }],
	['projects', { label: 'Projects', title: 'Projects', subtitle: tagline, images: await cells(data.projects.slice(0, 4)) }],
	['studio', { label: 'Studio', title: data.studio?.aboutHeading || 'Studio', subtitle: `The ${site} studio in Perth, Western Australia.`, images: await cells(data.studio?.images ?? []) }],
	['gallery', { label: 'Gallery', title: 'Gallery', subtitle: `A wall of work from the ${site} studio.`, images: await cells(data.gallery) }],
	['default', { label: `${site} Perth`, title: site, subtitle: tagline, wordmark: true }],
	...data.projects.filter((p) => p.slug).map((p) => [`projects/${p.slug}`, { label: p.client || 'Project', title: p.title, subtitle: p.tagline }]),
	...data.legal.map((p) => [p.slug, { label: 'Legal', title: p.title, subtitle: `${site} Perth Pty Ltd` }]),
];
for (const [file, props] of jobs) {
	if (file.startsWith('projects/')) {
		const project = data.projects.find((p) => `projects/${p.slug}` === file);
		props.images = [project?.video ? await frame(project.video, 600, H - BAR) : await panel(project?.image)].filter(Boolean);
	}
	await render(file, props);
}
console.log(`share images: ${jobs.length} written to public/og/`);
