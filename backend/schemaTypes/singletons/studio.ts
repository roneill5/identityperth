import {defineArrayMember, defineField, defineType} from 'sanity'
import {PresentationIcon} from '@sanity/icons/Presentation'

/**
 * The Studio page: a column of studio photography beside an accordion of
 * About, Services, Team, Clients and Contact. Services and Team are their
 * own documents; the client list is typed here (Belinda's selection, not
 * every client with a project; Ross, 29 Oct); Contact details live in Site
 * settings.
 */
export const studio = defineType({
  name: 'studio',
  title: 'Studio',
  type: 'document',
  icon: PresentationIcon,
  groups: [
    {name: 'about', title: 'About', default: true},
    {name: 'clients', title: 'Clients'},
    {name: 'photos', title: 'Photos'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({
      name: 'aboutHeading',
      group: 'about',
      title: 'About heading',
      type: 'string',
      description: 'e.g. Connected capability. Shown to screen readers and when motion is reduced.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'aboutHeadings',
      group: 'about',
      title: 'Heading phrases',
      type: 'array',
      description: 'Optional. The heading cycles through these, one word at a time, starting with the About heading.',
      of: [defineArrayMember({type: 'string'})],
    }),
    defineField({
      name: 'aboutBody',
      group: 'about',
      title: 'About text',
      type: 'blockContent',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'aboutHighlights',
      group: 'about',
      title: 'Highlights',
      type: 'array',
      description: 'Short lines shown in lime after the About text, e.g. The relationship stays close.',
      of: [defineArrayMember({type: 'string'})],
    }),
    defineField({
      name: 'clientsIntro',
      group: 'clients',
      title: 'Clients intro',
      type: 'text',
      rows: 2,
      description: 'Optional line above the client list.',
    }),
    defineField({
      name: 'clients',
      group: 'clients',
      title: 'Clients',
      type: 'array',
      description: 'The names shown under Clients, in this order. Just names: the Clients documents are what projects point at.',
      of: [defineArrayMember({type: 'string'})],
    }),
    defineField({
      name: 'images',
      group: 'photos',
      title: 'Studio photos',
      type: 'array',
      description:
        'The photo column beside the accordion, top to bottom in this order. Photos are cropped to 5:7 (1500 x 2083 is ideal); set the hotspot. While Team is open the column shows the portraits instead.',
      of: [defineArrayMember({type: 'figure'})],
      validation: (rule) => rule.min(1).warning('Add at least one photo'),
    }),
    defineField({name: 'seo', title: 'SEO', type: 'seo', group: 'seo'}),
  ],
  preview: {
    prepare() {
      return {title: 'Studio'}
    },
  },
})
