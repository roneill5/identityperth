import {defineArrayMember, defineField, defineType} from 'sanity'
import {orderRankField, orderRankOrdering} from '@sanity/orderable-document-list'
import {ImagesIcon} from '@sanity/icons/Images'

export const project = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  icon: ImagesIcon,
  orderings: [orderRankOrdering],
  groups: [
    {name: 'overview', title: 'Overview', default: true},
    {name: 'content', title: 'Content'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    orderRankField({type: 'project'}),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'The piece of work, e.g. Kindred Magazine',
      group: 'overview',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'client',
      title: 'Client',
      type: 'reference',
      to: [{type: 'client'}],
      group: 'overview',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'URL',
      type: 'slug',
      group: 'overview',
      options: {source: 'title', maxLength: 96},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      description: 'One line, e.g. A magazine made for life beyond the listing.',
      group: 'overview',
      validation: (rule) => rule.max(90).warning('Keep it to one line'),
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 4,
      description: 'Two or three sentences shown when hovering the project tile and at the top of the project page.',
      group: 'overview',
      validation: (rule) => rule.required().max(400),
    }),
    defineField({
      name: 'cover',
      title: 'Cover image',
      type: 'figure',
      description: 'Shown in the project tile and at the top of the project page. Set the hotspot: tiles are square, the page is wide.',
      group: 'overview',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'coverVideo',
      title: 'Cover video',
      type: 'video',
      description: 'Optional silent loop that plays over the cover image on hover and at the top of the project page.',
      group: 'overview',
    }),
    defineField({
      name: 'year',
      title: 'Year',
      type: 'number',
      group: 'overview',
      validation: (rule) => rule.integer().min(2000).max(2100),
    }),
    defineField({
      name: 'services',
      title: 'Services',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'service'}]})],
      group: 'overview',
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'body',
      title: 'Project content',
      type: 'projectBody',
      group: 'content',
    }),
    defineField({
      name: 'credits',
      title: 'Credits',
      type: 'array',
      group: 'content',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'credit',
          fields: [
            defineField({name: 'role', title: 'Role', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'name', title: 'Name', type: 'string', validation: (rule) => rule.required()}),
          ],
          preview: {select: {title: 'name', subtitle: 'role'}},
        }),
      ],
    }),
    defineField({name: 'seo', type: 'seo', group: 'seo'}),
  ],
  preview: {
    select: {title: 'title', client: 'client.name', media: 'cover'},
    prepare({title, client, media}) {
      return {title, subtitle: client, media}
    },
  },
})
