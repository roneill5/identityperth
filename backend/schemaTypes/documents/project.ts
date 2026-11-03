import {defineArrayMember, defineField, defineType} from 'sanity'
import {orderRankField, orderRankOrdering} from '@sanity/orderable-document-list'
import {ImagesIcon} from '@sanity/icons/Images'

/**
 * A project: what it is, who it was for, the cover, the words at the top of
 * the page and the exports in order. Nothing else (Ross, 28 Oct: lightweight,
 * no extra options). Three tabs (Ross, 3 Nov): Details, Media and SEO. The
 * page's title and description come from the details unless the SEO tab sets
 * its own; the share image is always generated.
 */
export const project = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  icon: ImagesIcon,
  orderings: [orderRankOrdering],
  groups: [
    {name: 'details', title: 'Details', default: true},
    {name: 'media', title: 'Media'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    orderRankField({type: 'project'}),
    defineField({
      name: 'title',
      group: 'details',
      title: 'Title',
      type: 'string',
      description: 'The piece of work, e.g. The DAM Wine Range',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'client',
      group: 'details',
      title: 'Client',
      type: 'reference',
      to: [{type: 'client'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      group: 'details',
      title: 'URL',
      type: 'slug',
      description: 'The address after identityperth.com/projects/',
      options: {source: 'title', maxLength: 96},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'cover',
      group: 'media',
      title: 'Cover',
      type: 'media',
      description: 'Export 1: an image or a silent video loop. Shown in the project tile and at the top of the project page. For images, set the hotspot: tiles are square, the page is wide.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'tagline',
      group: 'details',
      title: 'Tagline',
      type: 'string',
      description: 'The lime line under the title.',
      validation: (rule) => rule.max(160).warning('Keep it to a line or two'),
    }),
    defineField({
      name: 'summary',
      group: 'details',
      title: 'Summary',
      type: 'text',
      rows: 6,
      description: 'The paragraphs under the tagline. Separate them with a blank line. The first one is also the page description in search results unless the SEO tab sets one.',
      validation: (rule) => rule.required().max(1200).warning('Long for the top of a page'),
    }),
    defineField({
      name: 'services',
      group: 'details',
      title: 'Services',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'service'}]})],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'body',
      group: 'media',
      title: 'Project content',
      type: 'projectBody',
    }),
    defineField({name: 'seo', title: 'SEO', type: 'seo', group: 'seo'}),
  ],
  preview: {
    select: {title: 'title', client: 'client.name', media: 'cover.image'},
    prepare({title, client, media}) {
      return {title, subtitle: client, media}
    },
  },
})
