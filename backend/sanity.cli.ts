import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 't2bz0tb2',
    dataset: 'production',
  },
  // Keep the built Studio on the latest compatible Sanity release.
  deployment: {autoUpdates: true},
  // Generate TypeScript types for the Astro app's GROQ queries.
  typegen: {
    enabled: true,
    // Queries live in web/src/sanity/queries.ts; scanning .astro files trips
    // the parser on frontmatter that returns a Response.
    path: '../web/src/sanity/**/*.ts',
    schema: 'schema.json',
    generates: '../web/sanity.types.ts',
    overloadClientMethods: true,
  },
})
