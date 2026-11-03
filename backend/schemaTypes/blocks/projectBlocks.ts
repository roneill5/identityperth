import {defineArrayMember, defineField, defineType} from 'sanity'
import {ImageIcon} from '@sanity/icons/Image'
import {SplitHorizontalIcon} from '@sanity/icons/SplitHorizontal'

/** One wide image or video across the full width of the project page. */
export const mediaFull = defineType({
  name: 'mediaFull',
  title: 'Full width',
  type: 'object',
  icon: ImageIcon,
  fields: [defineField({name: 'media', type: 'media', validation: (rule) => rule.required()})],
  preview: {
    select: {image: 'media.image', alt: 'media.image.alt', kind: 'media.kind'},
    prepare({image, alt, kind}) {
      return {title: alt || 'Full width', subtitle: kind === 'video' ? 'Video, full width' : 'Full width', media: image ?? ImageIcon}
    },
  },
})

/** Two square images or videos side by side. */
export const mediaPair = defineType({
  name: 'mediaPair',
  title: 'Pair',
  type: 'object',
  icon: SplitHorizontalIcon,
  fields: [
    defineField({name: 'left', title: 'Left', type: 'media', validation: (rule) => rule.required()}),
    defineField({name: 'right', title: 'Right', type: 'media', validation: (rule) => rule.required()}),
  ],
  preview: {
    select: {left: 'left.image', right: 'right.image', leftAlt: 'left.image.alt', rightAlt: 'right.image.alt'},
    prepare({left, right, leftAlt, rightAlt}) {
      return {title: [leftAlt, rightAlt].filter(Boolean).join(' + ') || 'Pair', subtitle: 'Two squares', media: left ?? right ?? SplitHorizontalIcon}
    },
  },
})

/**
 * The ordered blocks that make up a project page: the exports in their
 * numbered order, squares in pairs and wides full width, with no set rhythm
 * (Ross, 28 Oct).
 */
export const projectBody = defineType({
  name: 'projectBody',
  title: 'Project content',
  type: 'array',
  description: 'The exports after the cover, in their numbered order: square ones side by side in a pair, wide ones full width.',
  of: [defineArrayMember({type: 'mediaFull'}), defineArrayMember({type: 'mediaPair'})],
})
