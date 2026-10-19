import {defineField, defineType} from 'sanity'
import {orderRankField, orderRankOrdering} from '@sanity/orderable-document-list'
import {CaseIcon} from '@sanity/icons/Case'

export const client = defineType({
  name: 'client',
  title: 'Client',
  type: 'document',
  icon: CaseIcon,
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({type: 'client'}),
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {title: 'name'},
  },
})
