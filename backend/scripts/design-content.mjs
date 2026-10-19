// Sets the published content to match the Figma design for review: the three
// projects from the Projects page with the design's images, the gallery wall
// from page 1, the Studio column photos, and grey placeholders for everything
// the design does not show. The v1 project imports are kept as drafts (the
// v1 gallery tiles are deleted; `npm run seed:build` regenerates them).
// Run from backend/: npx sanity exec scripts/design-content.mjs --with-user-token
import {getCliClient} from 'sanity/cli'
import {readFileSync} from 'node:fs'

const client = getCliClient({apiVersion: '2025-01-01'})
const SCRATCH = '/private/tmp/claude-501/-Users-rossoneill-Local-Sites-identityperth/805acff7-e2a1-42a3-bfb1-141df09c0141/scratchpad'
const PG = `${SCRATCH}/figma-compare/projects-gallery/assets/`
const ST = `${SCRATCH}/figma-compare/studio/assets/`
const PH = `${SCRATCH}/placeholder/`

const key = () => Math.random().toString(36).slice(2, 10)
const rank = (i) => `0|h${String(i).padStart(5, '0')}:`
const LOREM_TAGLINE = 'Lorem ipsum dolor sit amet, consectetur.'
const LOREM =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.'

async function upload(path, filename) {
  const asset = await client.assets.upload('image', readFileSync(path), {filename})
  return asset._id
}
const figure = (assetId, alt, hotspot) => ({
  _type: 'figure',
  asset: {_type: 'reference', _ref: assetId},
  alt,
  ...(hotspot ? {hotspot: {_type: 'sanity.imageHotspot', x: hotspot[0], y: hotspot[1], width: 0.5, height: 0.5}} : {}),
})

// ---- 1. assets
console.log('Uploading assets')
const a = {}
a.phSquare = await upload(`${PH}placeholder-square.png`, 'placeholder-square.png')
a.phPortrait = await upload(`${PH}placeholder-portrait.png`, 'placeholder-portrait.png')
a.pink = await upload(`${PG}projects_bitmap3_wide_pink-perky.png`, 'so-dam-pink-and-perky.png')
a.kindred = await upload(`${PG}projects_bitmap2_bottomleft_hover_kindred.png`, 'kindred-magazine-beyond-the-block.png')
a.pelvic = await upload(`${PG}projects_bitmap4_bottomright_pelvic-physio.png`, 'pelvic-physio-collective-website.png')
a.gKindred = await upload(`${PG}gallery_bitmap2_c1r1_beyond-the-block.png`, 'gallery-beyond-the-block.png')
a.gHoodie = await upload(`${PG}gallery_bitmap5_c2r1_element-hoodie.png`, 'gallery-element-hoodie.png')
a.gSkate = await upload(`${PG}gallery_bitmap8_c3r1_skateboard.png`, 'gallery-skateboard.png')
a.gPowerplay = await upload(`${PG}gallery_bitmap3_c1r2_powerplay.png`, 'gallery-powerplay.png')
a.gNotebooks = await upload(`${PG}gallery_bitmap6_c2r2_notebooks.png`, 'gallery-id-notebooks.png')
a.gVast = await upload(`${PG}gallery_bitmap9_c3r2_vast-land.png`, 'gallery-vast-land.png')
a.sMoto = await upload(`${ST}page3-about-image1-motorcycle-528x740.png`, 'studio-motorcycle.png')
a.sTable = await upload(`${ST}page4-services-image2-table-books-528x659.png`, 'studio-table-books.png')

// ---- 2. v1 gallery tiles go; v1 projects become drafts
console.log('Parking the v1 imports')
const oldGallery = await client.fetch('*[_type == "galleryItem" && !(_id in path("drafts.**"))]._id')
for (let i = 0; i < oldGallery.length; i += 50) {
  const tx = client.transaction()
  oldGallery.slice(i, i + 50).forEach((id) => tx.delete(id))
  await tx.commit()
}
const oldProjects = await client.fetch('*[_type == "project" && !(_id in path("drafts.**"))]')
for (const doc of oldProjects) {
  const {_rev, _createdAt, _updatedAt, ...rest} = doc
  await client.transaction().createIfNotExists({...rest, _id: `drafts.${doc._id}`}).delete(doc._id).commit()
}
console.log(`  ${oldGallery.length} gallery tiles removed, ${oldProjects.length} projects now drafts`)

// ---- 3. the design's projects and placeholders
console.log('Creating the design projects')
await client.createIfNotExists({
  _id: 'client-pelvic-physio-collective',
  _type: 'client',
  name: 'Pelvic Physio Collective',
  orderRank: rank(900),
})
const projects = [
  {
    _id: 'project-so-dam-pink-and-perky',
    title: 'So Dam Pink & Perky',
    slug: 'so-dam-pink-and-perky',
    client: 'client-the-dam',
    tagline: LOREM_TAGLINE,
    summary: LOREM,
    cover: figure(a.pink, 'So Dam Pink & Perky rosé bottle on pink', [0.5, 0.5]),
  },
  {
    _id: 'project-kindred-magazine',
    title: 'Kindred Magazine',
    slug: 'kindred-magazine',
    client: 'client-bromley-real-estate',
    tagline: 'A magazine made for life beyond the listing.',
    summary:
      'Created to extend the Bromley brand beyond commercial property, the magazine brings together editorial storytelling, considered design and a refined visual experience that reflects the depth, character and ambition of the business.',
    cover: figure(a.kindred, 'Kindred Magazine, Beyond the Block spread', [0.5, 0.5]),
  },
  {
    _id: 'project-pelvic-physio-collective',
    title: 'Pelvic Physio Collective',
    slug: 'pelvic-physio-collective',
    client: 'client-pelvic-physio-collective',
    tagline: LOREM_TAGLINE,
    summary: LOREM,
    cover: figure(a.pelvic, 'Pelvic Physio Collective website on a laptop', [0.5, 0.5]),
  },
  ...[4, 5, 6, 7, 8, 9].map((n) => ({
    _id: `project-placeholder-${String(n).padStart(2, '0')}`,
    title: `Placeholder ${String(n).padStart(2, '0')}`,
    slug: `placeholder-${String(n).padStart(2, '0')}`,
    client: null,
    tagline: LOREM_TAGLINE,
    summary: LOREM,
    cover: figure(a.phSquare, 'Placeholder'),
  })),
]
{
  const tx = client.transaction()
  projects.forEach((p, i) =>
    tx.createOrReplace({
      _id: p._id,
      _type: 'project',
      title: p.title,
      slug: {_type: 'slug', current: p.slug},
      ...(p.client ? {client: {_type: 'reference', _ref: p.client}} : {}),
      tagline: p.tagline,
      summary: p.summary,
      cover: p.cover,
      year: 2026,
      orderRank: rank(i),
    }),
  )
  await tx.commit()
}

// ---- 4. the gallery wall: the design's six full tiles, then placeholders
console.log('Hanging the gallery')
const wall = [
  {asset: a.gKindred, caption: 'Kindred Magazine', project: 'project-kindred-magazine'},
  {asset: a.gHoodie, caption: 'Element Construction'},
  {asset: a.gSkate, caption: 'Skate deck'},
  {asset: a.gPowerplay, caption: 'Powerplay'},
  {asset: a.gNotebooks, caption: 'Identity notebooks'},
  {asset: a.gVast, caption: 'Vast land, deeper stories'},
  ...Array.from({length: 9}, (_, i) => ({asset: a.phSquare, caption: `Lorem ipsum ${i + 1}`})),
]
{
  const tx = client.transaction()
  wall.forEach((item, i) =>
    tx.createOrReplace({
      _id: `gallery-design-${String(i + 1).padStart(2, '0')}`,
      _type: 'galleryItem',
      image: figure(item.asset, item.caption),
      caption: item.caption,
      ...(item.project ? {project: {_type: 'reference', _ref: item.project}} : {}),
      orderRank: rank(100 + i),
    }),
  )
  await tx.commit()
}

// ---- 5. the Studio column
console.log('Studio column')
await client
  .patch('studio')
  .set({
    images: [figure(a.sMoto, 'Motorcycle', [0.5, 0.45]), figure(a.sTable, 'Table and books', [0.5, 0.5])].map((f) => ({...f, _key: key()})),
    clientsImages: [{...figure(a.phPortrait, 'Placeholder'), _key: key()}],
    contactImages: [{...figure(a.phPortrait, 'Placeholder'), _key: key()}],
  })
  .commit()
const services = await client.fetch('*[_type == "service" && !(_id in path("drafts.**"))]._id')
{
  const tx = client.transaction()
  services.forEach((id) => tx.patch(id, (p) => p.set({image: figure(a.phPortrait, 'Placeholder')})))
  await tx.commit()
}
console.log('Done')
