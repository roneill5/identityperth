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
  // The site's own /studio is the agency page, so the CMS lives at /backend.
  basePath: '/backend',

  plugins: [
    structureTool({structure}),
    // Presentation: the site inside the Studio, draft content included, with
    // click-to-edit overlays. The site's /preview routes do the rendering;
    // /preview/enable is where the Studio proves itself and gets a cookie.
    presentationTool({
      previewUrl: {
        // The Studio ships inside the site at /backend, so the preview is same-origin
        // everywhere except `sanity dev` (port 3333), which previews the Astro dev server.
        origin: typeof location !== 'undefined' && location.port === '3333' ? 'http://localhost:4321' : 'same-origin',
        preview: '/',
        previewMode: {enable: '/preview/enable', disable: '/preview/disable'},
      },
      resolve: {
        mainDocuments: defineDocuments([
          {route: '/', filter: '_id == "home"'},
          {route: '/studio', filter: '_id == "studio"'},
          {route: '/projects/:slug', filter: '_type == "project" && slug.current == $slug'},
        ]),
        locations: {
          home: defineLocations({resolve: () => ({locations: [{title: 'Home', href: '/'}]})}),
          studio: defineLocations({resolve: () => ({locations: [{title: 'Studio', href: '/studio'}]})}),
          siteSettings: defineLocations({
            resolve: () => ({locations: [{title: 'Home', href: '/'}, {title: 'Studio', href: '/studio'}]}),
          }),
          project: defineLocations({
            select: {title: 'title', slug: 'slug.current'},
            resolve: (doc) => ({
              locations: [
                {title: doc?.title || 'Project', href: `/projects/${doc?.slug}`},
                {title: 'Projects', href: '/projects'},
              ],
            }),
          }),
          galleryItem: defineLocations({resolve: () => ({locations: [{title: 'Gallery', href: '/gallery'}]})}),
          service: defineLocations({resolve: () => ({locations: [{title: 'Studio', href: '/studio'}]})}),
          teamMember: defineLocations({resolve: () => ({locations: [{title: 'Studio', href: '/studio'}]})}),
          client: defineLocations({resolve: () => ({locations: [{title: 'Studio', href: '/studio'}]})}),
          testimonial: defineLocations({resolve: () => ({locations: [{title: 'Studio', href: '/studio'}]})}),
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
