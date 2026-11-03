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
      rows: 5,
      description: 'What the service covers, then a blank line and a sentence or two about it. Each part shows as its own paragraph on the Studio page.',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {title: 'title', subtitle: 'description'},
  },
})
