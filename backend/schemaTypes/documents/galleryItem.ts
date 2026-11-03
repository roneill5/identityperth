import {defineField, defineType} from 'sanity'
import {orderRankField, orderRankOrdering} from '@sanity/orderable-document-list'
import {ImageIcon} from '@sanity/icons/Image'

/** One tile on the Gallery wall: an image at its own shape. Nothing is written on the wall (Bel, 21 Oct). */
export const galleryItem = defineType({
  name: 'galleryItem',
  title: 'Gallery image',
  type: 'document',
  icon: ImageIcon,
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({type: 'galleryItem'}),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'figure',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {alt: 'image.alt', media: 'image'},
    prepare({alt, media}) {
      return {title: alt || 'Gallery image', media}
    },
  },
})
