import {defineField, defineType} from 'sanity'
import {orderRankField, orderRankOrdering} from '@sanity/orderable-document-list'
import {SparklesIcon} from '@sanity/icons/Sparkles'

export const service = defineType({
  name: 'service',
  title: 'Service',
  type: 'document',
  icon: SparklesIcon,
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({type: 'service'}),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'e.g. Brand & Identity',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      description: 'One or two sentences, e.g. Verbal and visual identity, brand systems, guidelines, tone of voice, identity development and implementation.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'figure',
      description: 'Shown in the Studio page photo column while this service is open. Without one, the cover of the first project that used this service is shown.',
    }),
  ],
  preview: {
    select: {title: 'title', subtitle: 'description'},
  },
})
