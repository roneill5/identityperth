// Sets the home ticker to COPY.ticker from content.mjs, on the published
// document and on a draft if one is open in the Studio.
// Run from backend/: npx sanity exec scripts/set-ticker.mjs --with-user-token
import {getCliClient} from 'sanity/cli'
import {COPY} from './content.mjs'

const client = getCliClient({apiVersion: '2025-01-01'})
const ids = ['home', 'drafts.home']
const existing = await client.fetch('*[_id in $ids]{_id, ticker}', {ids})

for (const doc of existing) {
  const detail = doc.ticker?.[0]?.detail ?? 'Perth, Western Australia'
  const ticker = COPY.ticker.map((phrase, i) => ({
    _type: 'tickerItem',
    _key: doc.ticker?.[i]?._key ?? `ticker-${i}`,
    phrase,
    detail,
  }))
  await client.patch(doc._id).set({ticker}).commit()
  console.log(`${doc._id}: ${ticker.map((t) => t.phrase).join(' / ')}`)
}
if (!existing.length) console.log('No home document found.')
