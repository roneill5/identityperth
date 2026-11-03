import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 't2bz0tb2',
    dataset: 'production',
  },
  // The Studio lives under /backend of the site. sanity.config.ts carries the
  // same path for routing; this one tells `sanity build` to write asset URLs
  // under it (without it they come out root-relative and the Studio is blank).
  project: {basePath: '/backend'},
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
