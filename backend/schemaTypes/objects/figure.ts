import {defineField, defineType} from 'sanity'
import {ImageIcon} from '@sanity/icons/Image'

/** An image with a hotspot and alt text. */
export const figure = defineType({
  name: 'figure',
  title: 'Image',
  type: 'image',
  icon: ImageIcon,
  options: {hotspot: true},
  fields: [
    defineField({
      name: 'alt',
      title: 'Alternative text',
      type: 'string',
      description: 'Describe the image in a sentence for screen readers and search engines.',
      validation: (rule) => rule.required().warning('Alt text helps accessibility and SEO'),
    }),
  ],
})
