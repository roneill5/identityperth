// Creates the Sanity webhook that rebuilds the site when something is published.
// It posts to a Cloudflare Workers Builds deploy hook (Worker, Settings, Builds,
// Deploy Hooks), so Workers Builds runs the normal build and deploy.
//
// Run from backend/ with the CLI login:
//   npx sanity exec scripts/rebuild-webhook.mjs --with-user-token -- <deploy hook URL>
//   npx sanity exec scripts/rebuild-webhook.mjs --with-user-token -- --list
//   npx sanity exec scripts/rebuild-webhook.mjs --with-user-token -- --delete <id>
//
// The deploy hook URL is a credential (anyone holding it can start builds), so it
// is only ever stored inside the webhook on Sanity, never in this repo.
import {getCliClient} from 'sanity/cli'

const PROJECT_ID = 't2bz0tb2'
const NAME = 'Rebuild site on publish'
const SITE_TYPES = `_type in ${JSON.stringify(['home', 'studio', 'siteSettings', 'project', 'client', 'service', 'teamMember', 'galleryItem', 'legalPage'])}`
const client = getCliClient({apiVersion: '2025-08-04'})
const hooks = (opts = {}) => client.request({url: `/hooks/projects/${PROJECT_ID}`, ...opts})

const args = process.argv.slice(2)
const url = args.find((a) => a.startsWith('https://'))
const deleteAt = args.indexOf('--delete')
const show = (h) =>
  console.log(`${h.id}  ${h.isDisabled ? 'disabled' : 'active  '}  ${h.name}  ->  ${h.url}  (${h.dataset}, on ${h.rule?.on?.join('/') ?? '?'})`)

if (args.includes('--list')) {
  const list = await hooks()
  if (!list.length) console.log('No webhooks on the project yet.')
  list.forEach(show)
} else if (deleteAt !== -1) {
  const id = args[deleteAt + 1]
  if (!id) throw new Error('Give the webhook id to delete (see --list).')
  await client.request({url: `/hooks/projects/${PROJECT_ID}/${id}`, method: 'DELETE'})
  console.log(`Deleted webhook ${id}.`)
} else {
  if (!url) throw new Error('Give the Cloudflare deploy hook URL (https://api.cloudflare.com/client/v4/workers/builds/deploy_hooks/...).')
  if (!url.startsWith('https://api.cloudflare.com/client/v4/workers/builds/deploy_hooks/')) {
    throw new Error('That is not a Workers Builds deploy hook URL.')
  }
  const existing = (await hooks()).find((h) => h.name === NAME)
  if (existing) {
    console.log('A webhook with this name already exists; delete it first if the URL has changed:')
    show(existing)
    process.exit(1)
  }
  const created = await hooks({
    method: 'POST',
    body: {
      type: 'document',
      name: NAME,
      description: 'Posts to the Cloudflare Workers Builds deploy hook so the site rebuilds with the latest published content.',
      url,
      dataset: 'production',
      apiVersion: 'v2025-02-19',
      httpMethod: 'POST',
      // Only published changes matter: drafts are what the Studio preview is for.
      includeDrafts: false,
      includeAllVersions: false,
      headers: {},
      // The site's own document types (Sanity requires a filter, and the preview's
      // secret documents must not start builds). The deploy hook ignores the body,
      // so send the smallest possible one.
      rule: {on: ['create', 'update', 'delete'], filter: SITE_TYPES, projection: '{_id, _type}'},
      isDisabledByUser: false,
    },
  })
  console.log('Created:')
  show(created)
  console.log('Publish something in the Studio and watch the build start under Deployments on the Worker.')
}
