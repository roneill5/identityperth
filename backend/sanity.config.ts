import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {schemaTypes} from './schemaTypes'
import {structure, SINGLETONS} from './structure'

export default defineConfig({
  name: 'default',
  title: 'Identity Perth',

  projectId: 't2bz0tb2',
  dataset: 'production',
  // The site's own /studio is the agency page, so the CMS lives at /backend.
  basePath: '/backend',

  plugins: [structureTool({structure})],

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
