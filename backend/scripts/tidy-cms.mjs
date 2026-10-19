// Brings the live documents in line with the simplified schema (19 Oct):
// one hero image, phrase-only ticker, and no fields the site never used.
// Safe to re-run. Run from backend/: npx sanity exec scripts/tidy-cms.mjs --with-user-token
import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2025-01-01'})
const ids = (q) => client.fetch(`*[${q}]._id`)

// Home: first slide becomes the hero image, ticker items become plain phrases.
for (const id of await ids('_type == "home"')) {
  const home = await client.getDocument(id)
  const heroImage = home.heroImage ?? home.heroSlides?.find((s) => s.image?.asset)?.image ?? null
  const ticker = (home.ticker ?? []).map((t) => (typeof t === 'string' ? t : t?.phrase)).filter(Boolean)
  await client
    .patch(id)
    .set({ticker, ...(heroImage ? {heroImage: {...heroImage, _type: 'figure'}} : {})})
    .unset(['heroSlides', 'heroInterval', 'heroHeading', 'heroAdvance', 'sections', 'journeySections'])
    .commit()
  console.log(`${id}: hero image ${heroImage ? 'kept' : 'missing'}, ${ticker.length} phrases`)
}

const unsetAll = async (type, fields) => {
  const list = await ids(`_type == "${type}"`)
  for (let i = 0; i < list.length; i += 50) {
    const tx = client.transaction()
    list.slice(i, i + 50).forEach((id) => tx.patch(id, (p) => p.unset(fields)))
    await tx.commit()
  }
  console.log(`${type}: ${list.length} documents, dropped ${fields.join(', ')}`)
}
await unsetAll('project', ['featured'])
await unsetAll('client', ['logo', 'website', 'showInTrustedBy'])
await unsetAll('service', ['deliverables'])
await unsetAll('teamMember', ['email'])
await unsetAll('studio', ['servicesIntro', 'teamIntro'])

// Nested objects: figures lose their caption, videos keep only the Stream ID and playback.
const DROP = {figure: ['caption'], video: ['source', 'mp4Url', 'vimeoUrl', 'file', 'poster']}
const scrub = (node) => {
  if (Array.isArray(node)) return node.map(scrub)
  if (node && typeof node === 'object') {
    const drop = DROP[node._type] ?? []
    return Object.fromEntries(Object.entries(node).filter(([k]) => !drop.includes(k)).map(([k, v]) => [k, scrub(v)]))
  }
  return node
}
const all = await client.fetch('*[_type in ["home", "studio", "project", "galleryItem", "service", "teamMember"]]')
let touched = 0
for (const doc of all) {
  let next = scrub(doc)
  if (next.coverVideo && !next.coverVideo.streamId) delete next.coverVideo
  if (JSON.stringify(next) !== JSON.stringify(doc)) {
    await client.createOrReplace(next)
    touched += 1
  }
}
console.log(`nested fields scrubbed on ${touched} documents`)

const articles = await ids('_type == "article"')
if (articles.length) {
  const tx = client.transaction()
  articles.forEach((id) => tx.delete(id))
  await tx.commit()
}
console.log(`articles removed: ${articles.length}`)
