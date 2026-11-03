import {defineArrayMember, defineField, defineType} from 'sanity'
import {orderRankField, orderRankOrdering} from '@sanity/orderable-document-list'
import {ImagesIcon} from '@sanity/icons/Images'

/**
 * A project: what it is, who it was for, the cover, the words at the top of
 * the page and the exports in order. Nothing else (Ross, 28 Oct: lightweight,
 * no extra options). The page's title, description and share image come from
 * these fields, so there is nothing separate to fill in for search engines.
 */
export const project = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  icon: ImagesIcon,
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({type: 'project'}),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'The piece of work, e.g. The DAM Wine Range',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'client',
      title: 'Client',
      type: 'reference',
      to: [{type: 'client'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'URL',
      type: 'slug',
      description: 'The address after identityperth.com/projects/',
      options: {source: 'title', maxLength: 96},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'cover',
      title: 'Cover',
      type: 'media',
      description: 'Export 1: an image or a silent video loop. Shown in the project tile and at the top of the project page. For images, set the hotspot: tiles are square, the page is wide.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      description: 'The lime line under the title.',
      validation: (rule) => rule.max(160).warning('Keep it to a line or two'),
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 6,
      description: 'The paragraphs under the tagline. Separate them with a blank line. The first one is also the page description in search results.',
      validation: (rule) => rule.required().max(1200).warning('Long for the top of a page'),
    }),
    defineField({
      name: 'services',
      title: 'Services',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'service'}]})],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'body',
      title: 'Project content',
      type: 'projectBody',
    }),
  ],
  preview: {
    select: {title: 'title', client: 'client.name', media: 'cover.image'},
    prepare({title, client, media}) {
      return {title, subtitle: client, media}
    },
  },
})
