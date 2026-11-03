import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {presentationTool, defineLocations, defineDocuments} from 'sanity/presentation'
import {schemaTypes} from './schemaTypes'
import {structure, SINGLETONS} from './structure'

export default defineConfig({
  name: 'default',
  title: 'Identity Perth',

  projectId: 't2bz0tb2',
  dataset: 'production',
  // The CMS lives at /backend (the site's own /studio is the agency page). That
  // path is set once, in sanity.cli.ts (`project.basePath`), which the build
  // and the dev server both apply; setting it here as well would double it.

  plugins: [
    structureTool({structure}),
    // Presentation: the site inside the Studio, draft content included, with
    // click-to-edit overlays. The site's /preview routes do the rendering;
    // /preview/enable is where the Studio proves itself and gets a cookie.
    presentationTool({
      previewUrl: {
        // The Studio ships inside the site at /backend, so the preview origin is the
        // Studio's own and is left unset (a literal like 'same-origin' crashes the tool
        // with "Invalid base URL"). Only `sanity dev` on port 3333 previews elsewhere:
        // the Astro dev server on 4321.
        ...(typeof location !== 'undefined' && location.port === '3333' ? {origin: 'http://localhost:4321'} : {}),
        preview: '/',
        previewMode: {enable: '/preview/enable', disable: '/preview/disable'},
      },
      resolve: {
        mainDocuments: defineDocuments([
          {route: '/', filter: '_id == "home"'},
          {route: '/studio', filter: '_id == "studio"'},
          {route: '/projects/:slug', filter: '_type == "project" && slug.current == $slug'},
          {route: '/:slug', filter: '_type == "legalPage" && slug.current == $slug'},
          // Lists with no document of their own open Site settings: their menu, contact details and sharing defaults.
          {route: '/projects', filter: '_id == "siteSettings"'},
          {route: '/gallery', filter: '_id == "siteSettings"'},
        ]),
        locations: {
          // Every resolver needs a `select`, or the Studio says the document is not used on any page.
          home: defineLocations({select: {id: '_id'}, resolve: () => ({locations: [{title: 'Home', href: '/'}]})}),
          studio: defineLocations({select: {id: '_id'}, resolve: () => ({locations: [{title: 'Studio', href: '/studio'}]})}),
          siteSettings: defineLocations({message: 'Used on every page: the menu, contact details and search defaults', tone: 'positive'}),
          project: defineLocations({
            select: {title: 'title', slug: 'slug.current'},
            resolve: (doc) => ({
              locations: [
                {title: doc?.title || 'Project', href: `/projects/${doc?.slug}`},
                {title: 'Projects', href: '/projects'},
              ],
            }),
          }),
          galleryItem: defineLocations({select: {id: '_id'}, resolve: () => ({locations: [{title: 'Gallery', href: '/gallery'}]})}),
          service: defineLocations({select: {id: '_id'}, resolve: () => ({locations: [{title: 'Studio', href: '/studio'}]})}),
          teamMember: defineLocations({select: {id: '_id'}, resolve: () => ({locations: [{title: 'Studio', href: '/studio'}]})}),
          client: defineLocations({select: {id: '_id'}, resolve: () => ({locations: [{title: 'Projects', href: '/projects'}]})}),
          legalPage: defineLocations({
            select: {title: 'title', slug: 'slug.current'},
            resolve: (doc) => ({locations: [{title: doc?.title || 'Legal page', href: `/${doc?.slug}`}]}),
          }),
        },
      },
    }),
  ],

  schema: {
    types: schemaTypes,
    // Singletons are opened from the sidebar, never created from the "new document" menu.
    templates: (templates) => templates.filter((template) => !SINGLETONS.has(template.schemaType)),
  },

  document: {
    // Singletons cannot be duplicated, unpublished or deleted.
    actions: (actions, {schemaType}) =>
      SINGLETONS.has(schemaType)
        ? actions.filter(({action}) => action && ['publish', 'discardChanges', 'restore'].includes(action))
        : actions,
  },
})
