import {defineField, defineType} from 'sanity'
import {SearchIcon} from '@sanity/icons/Search'

export const seo = defineType({
  name: 'seo',
  title: 'SEO and sharing',
  type: 'object',
  icon: SearchIcon,
  options: {collapsible: true, collapsed: true},
  fields: [
    defineField({
      name: 'title',
      title: 'Meta title',
      type: 'string',
      description: 'Shown in search results and the browser tab. Leave empty to use the page title.',
      validation: (rule) => rule.max(70).warning('Keep it under 70 characters so it is not cut off'),
    }),
    defineField({
      name: 'description',
      title: 'Meta description',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.max(160).warning('Keep it under 160 characters'),
    }),
    defineField({
      name: 'image',
      title: 'Share image',
      type: 'image',
      description: 'Shown when the page is shared on social media. 1200 x 630 works best.',
      options: {hotspot: true},
    }),
  ],
})
