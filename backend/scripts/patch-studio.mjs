// Brings the live Studio document in line with the new fields without a full
// re-import: heading phrases, the image sets per section, and the two intro
// fields the design does not use.
// Run from backend/: npx sanity exec scripts/patch-studio.mjs --with-user-token
import {getCliClient} from 'sanity/cli'
import {COPY} from './content.mjs'

const client = getCliClient({apiVersion: '2025-01-01'})
const docs = await client.fetch('*[_id in ["studio", "drafts.studio"]]{_id, images, clientsImages, contactImages}')

for (const doc of docs) {
  const all = [...(doc.images ?? []), ...(doc.clientsImages ?? []), ...(doc.contactImages ?? [])]
  await client
    .patch(doc._id)
    .set({
      aboutHeadings: COPY.ticker,
      images: all.slice(0, 2),
      clientsImages: all.slice(2, 4),
      contactImages: all.slice(4, 6),
    })
    .unset(['servicesIntro', 'teamIntro'])
    .commit()
  console.log(`${doc._id}: ${all.length} images split 2 / 2 / 2, headings set`)
}
if (!docs.length) console.log('No studio document found.')
