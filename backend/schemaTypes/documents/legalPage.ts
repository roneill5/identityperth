import {defineField, defineType} from 'sanity'
import {orderRankField, orderRankOrdering} from '@sanity/orderable-document-list'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'

/** Addresses that belong to the site itself, so a legal page cannot take them. */
const RESERVED = new Set(['projects', 'studio', 'gallery', 'thinking', 'backend', 'preview', '404'])

/**
 * A legal page (Terms & Conditions, a privacy policy): a title, an address and
 * the text. Legal pages are unlisted: nothing on the site links to them, so
 * share the address directly. `backend/scripts/import-legal.mjs` loads one
 * from a Word document.
 */
export const legalPage = defineType({
  name: 'legalPage',
  title: 'Legal page',
  type: 'document',
  icon: DocumentTextIcon,
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({type: 'legalPage'}),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'e.g. Terms & Conditions',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'URL',
      type: 'slug',
      description: 'The address after identityperth.com/, e.g. terms. Nothing links to it, so share it directly.',
      options: {source: 'title', maxLength: 48},
      validation: (rule) =>
        rule
          .required()
          .custom((slug) =>
            slug?.current && RESERVED.has(slug.current) ? 'That address belongs to a section of the site' : true,
          ),
    }),
    defineField({
      name: 'body',
      title: 'Text',
      type: 'blockContent',
      description:
        'Heading for each part, Subheading for a numbered clause, Minor heading for a sub-clause. Lettered items, (a), (b) and so on, go in a bullet list with the letters kept in the text; the page shows them without bullets.',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {title: 'title', slug: 'slug.current'},
    prepare({title, slug}) {
      return {title, subtitle: slug ? `/${slug}` : undefined}
    },
  },
})
