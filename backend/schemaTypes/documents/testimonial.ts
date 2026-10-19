import {defineField, defineType} from 'sanity'
import {orderRankField, orderRankOrdering} from '@sanity/orderable-document-list'
import {CommentIcon} from '@sanity/icons/Comment'

export const testimonial = defineType({
  name: 'testimonial',
  title: 'Client comment',
  type: 'document',
  icon: CommentIcon,
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({type: 'testimonial'}),
    defineField({
      name: 'quote',
      title: 'Quote',
      type: 'text',
      rows: 5,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'role',
      title: 'Role',
      type: 'string',
      description: 'e.g. Managing Director',
    }),
    defineField({
      name: 'client',
      title: 'Client',
      type: 'reference',
      to: [{type: 'client'}],
    }),
  ],
  preview: {
    select: {title: 'name', client: 'client.name', quote: 'quote'},
    prepare({title, client, quote}) {
      return {title: [title, client].filter(Boolean).join(', '), subtitle: quote}
    },
  },
})
