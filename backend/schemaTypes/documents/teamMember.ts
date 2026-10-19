import {defineField, defineType} from 'sanity'
import {orderRankField, orderRankOrdering} from '@sanity/orderable-document-list'
import {UserIcon} from '@sanity/icons/User'

export const teamMember = defineType({
  name: 'teamMember',
  title: 'Team member',
  type: 'document',
  icon: UserIcon,
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({type: 'teamMember'}),
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
      description: 'e.g. Brand & Creative Lead',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'bio',
      title: 'Bio',
      type: 'text',
      rows: 5,
      description: 'Two or three sentences.',
    }),
    defineField({
      name: 'portrait',
      title: 'Portrait',
      type: 'figure',
      description: 'Portrait orientation, black and white to match the Studio page.',
    }),
  ],
  preview: {
    select: {title: 'name', subtitle: 'role', media: 'portrait'},
  },
})
