import {defineField, defineType} from 'sanity'
import {orderRankField, orderRankOrdering} from '@sanity/orderable-document-list'
import {CaseIcon} from '@sanity/icons/Case'

/**
 * A client: a name that projects point at. The Studio page's client list is
 * typed on the Studio page itself (Belinda's selection), so adding a client
 * here does not put it on that list (Ross, 29 Oct).
 */
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
