import {defineField, defineType} from 'sanity'
import {SearchIcon} from '@sanity/icons/Search'

/** The SEO tab: a search title and description. Share images are generated for every page (web/scripts/og.mjs), so there is no field for one (Ross, 3 Nov). */
export const seo = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  icon: SearchIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Meta title',
      type: 'string',
      description: 'The browser tab and search result title. Leave empty for the page\'s own title followed by Identity Perth.',
      validation: (rule) => rule.max(70).warning('Keep it under 70 characters so it is not cut off'),
    }),
    defineField({
      name: 'description',
      title: 'Meta description',
      type: 'text',
      rows: 3,
      description: 'The line under the title in search results. Leave empty for the page\'s own opening words.',
      validation: (rule) => rule.max(160).warning('Keep it under 160 characters'),
    }),
  ],
})
