import {defineArrayMember, defineField, defineType} from 'sanity'
import {CogIcon} from '@sanity/icons/Cog'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  icon: CogIcon,
  groups: [
    {name: 'general', title: 'General', default: true},
    {name: 'contact', title: 'Contact'},
    {name: 'seo', title: 'SEO defaults'},
  ],
  fields: [
    defineField({
      name: 'siteName',
      title: 'Site name',
      type: 'string',
      group: 'general',
      initialValue: 'Identity',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      description: 'Shown in the menu, e.g. Great branding isn’t magic, it’s method.',
      group: 'general',
    }),
    defineField({
      name: 'menuText',
      title: 'Menu text',
      type: 'text',
      rows: 3,
      description: 'Short invitation shown in the menu above the contact details.',
      group: 'general',
    }),
    defineField({
      name: 'email',
      title: 'Enquiries email',
      type: 'string',
      group: 'contact',
      validation: (rule) => rule.email().required(),
    }),
    defineField({
      name: 'careersEmail',
      title: 'Careers email',
      type: 'string',
      group: 'contact',
      validation: (rule) => rule.email(),
    }),
    defineField({
      name: 'phone',
      title: 'Phone',
      type: 'string',
      group: 'contact',
    }),
    defineField({
      name: 'address',
      title: 'Address',
      type: 'text',
      rows: 3,
      group: 'contact',
    }),
    defineField({
      name: 'socials',
      title: 'Social links',
      type: 'array',
      group: 'contact',
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
      title: 'Default SEO',
      type: 'seo',
      description: 'Used for pages that have no SEO values of their own.',
      group: 'seo',
    }),
  ],
  preview: {
    prepare() {
      return {title: 'Site settings'}
    },
  },
})
