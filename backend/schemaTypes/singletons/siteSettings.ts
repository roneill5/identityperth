import {defineArrayMember, defineField, defineType} from 'sanity'
import {CogIcon} from '@sanity/icons/Cog'

/** The menu's words, the contact details and the search defaults. The site name is fixed in the code. */
export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  icon: CogIcon,
  groups: [
    {name: 'menu', title: 'Menu', default: true},
    {name: 'contact', title: 'Contact'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({
      name: 'tagline',
      group: 'menu',
      title: 'Tagline',
      type: 'string',
      description: 'Shown in the menu, e.g. Great branding isn’t magic, it’s method.',
    }),
    defineField({
      name: 'menuText',
      group: 'menu',
      title: 'Menu text',
      type: 'text',
      rows: 2,
      description: 'Short invitation shown in the menu above the contact details.',
    }),
    defineField({
      name: 'email',
      group: 'contact',
      title: 'Enquiries email',
      type: 'string',
      validation: (rule) => rule.email().required(),
    }),
    defineField({
      name: 'careersEmail',
      group: 'contact',
      title: 'Join us email',
      type: 'string',
      validation: (rule) => rule.email(),
    }),
    defineField({
      name: 'phone',
      group: 'contact',
      title: 'Phone',
      type: 'string',
    }),
    defineField({
      name: 'address',
      group: 'contact',
      title: 'Address',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'socials',
      group: 'contact',
      title: 'Social links',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'social',
          fields: [
            defineField({name: 'label', title: 'Label', type: 'string', description: 'e.g. instagram', validation: (rule) => rule.required()}),
            defineField({name: 'url', title: 'URL', type: 'url', validation: (rule) => rule.required()}),
          ],
          preview: {select: {title: 'label', subtitle: 'url'}},
        }),
      ],
    }),
    defineField({
      name: 'seo',
      group: 'seo',
      title: 'Search defaults',
      type: 'seo',
      description: 'Used by pages that have no description of their own.',
    }),
  ],
  preview: {
    prepare() {
      return {title: 'Site settings'}
    },
  },
})
