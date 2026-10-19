import {defineArrayMember, defineField, defineType} from 'sanity'
import {PresentationIcon} from '@sanity/icons/Presentation'

/**
 * The Studio page: a column of studio photography beside an accordion of
 * About, Services, Team, Clients and Contact. Services, Team and Clients are
 * their own documents; Contact details live in Site settings.
 */
export const studio = defineType({
  name: 'studio',
  title: 'Studio',
  type: 'document',
  icon: PresentationIcon,
  groups: [
    {name: 'about', title: 'About', default: true},
    {name: 'images', title: 'Images'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({
      name: 'aboutHeading',
      title: 'About heading',
      type: 'string',
      description: 'e.g. Connected capability. Shown to screen readers and when motion is reduced.',
      group: 'about',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'aboutHeadings',
      title: 'Heading phrases',
      type: 'array',
      description: 'Optional. The heading cycles through these, one word at a time, starting with the About heading.',
      group: 'about',
      of: [defineArrayMember({type: 'string'})],
    }),
    defineField({
      name: 'aboutBody',
      title: 'About text',
      type: 'blockContent',
      group: 'about',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'aboutHighlights',
      title: 'Highlights',
      type: 'array',
      description: 'Short lines shown in lime after the About text, e.g. The relationship stays close.',
      group: 'about',
      of: [defineArrayMember({type: 'string'})],
    }),
    defineField({
      name: 'clientsIntro',
      title: 'Clients intro',
      type: 'text',
      rows: 3,
      description: 'Optional text above the client list.',
      group: 'about',
    }),
    defineField({
      name: 'images',
      title: 'About images',
      type: 'array',
      description:
        'The photo column beside the accordion is in the same order as the accordion: these show while About is open, then each service, each team portrait, then the Clients and Contact images. Scrolling the column opens the matching section. Photos are cropped to 5:7; set the hotspot.',
      group: 'images',
      of: [defineArrayMember({type: 'figure'})],
      validation: (rule) => rule.min(1).warning('Add at least one image'),
    }),
    defineField({
      name: 'clientsImages',
      title: 'Clients images',
      type: 'array',
      description: 'Shown in the column while Clients is open.',
      group: 'images',
      of: [defineArrayMember({type: 'figure'})],
    }),
    defineField({
      name: 'contactImages',
      title: 'Contact images',
      type: 'array',
      description: 'Shown in the column while Contact is open.',
      group: 'images',
      of: [defineArrayMember({type: 'figure'})],
    }),
    defineField({name: 'seo', type: 'seo', group: 'seo'}),
  ],
  preview: {
    prepare() {
      return {title: 'Studio'}
    },
  },
})
