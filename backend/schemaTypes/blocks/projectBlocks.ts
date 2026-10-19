import {defineArrayMember, defineField, defineType} from 'sanity'
import {ImageIcon} from '@sanity/icons/Image'
import {SplitHorizontalIcon} from '@sanity/icons/SplitHorizontal'
import {TextIcon} from '@sanity/icons/Text'
import {BlockquoteIcon} from '@sanity/icons/Blockquote'

/** One image or video across the full width of the project page. */
export const mediaFull = defineType({
  name: 'mediaFull',
  title: 'Full width media',
  type: 'object',
  icon: ImageIcon,
  fields: [
    defineField({name: 'media', type: 'media', validation: (rule) => rule.required()}),
    defineField({name: 'caption', title: 'Caption', type: 'string'}),
  ],
  preview: {
    select: {caption: 'caption', image: 'media.image', poster: 'media.video.poster', kind: 'media.kind'},
    prepare({caption, image, poster, kind}) {
      return {title: caption || 'Full width media', subtitle: kind === 'video' ? 'Video' : 'Image', media: image ?? poster ?? ImageIcon}
    },
  },
})

/** Two images or videos side by side. */
export const mediaPair = defineType({
  name: 'mediaPair',
  title: 'Media pair',
  type: 'object',
  icon: SplitHorizontalIcon,
  fields: [
    defineField({
      name: 'shape',
      title: 'Tile shape',
      type: 'string',
      options: {
        list: [
          {title: 'Square', value: 'square'},
          {title: 'Portrait', value: 'portrait'},
          {title: 'Landscape', value: 'landscape'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'square',
    }),
    defineField({name: 'left', title: 'Left', type: 'media', validation: (rule) => rule.required()}),
    defineField({name: 'right', title: 'Right', type: 'media', validation: (rule) => rule.required()}),
  ],
  preview: {
    select: {left: 'left.image', right: 'right.image', shape: 'shape'},
    prepare({left, right, shape}) {
      return {title: 'Media pair', subtitle: shape ? `${shape} tiles` : undefined, media: left ?? right ?? SplitHorizontalIcon}
    },
  },
})

/** A heading with a column of text. */
export const textBlock = defineType({
  name: 'textBlock',
  title: 'Text',
  type: 'object',
  icon: TextIcon,
  fields: [
    defineField({name: 'heading', title: 'Heading', type: 'string'}),
    defineField({name: 'body', title: 'Body', type: 'blockContent', validation: (rule) => rule.required()}),
  ],
  preview: {
    select: {title: 'heading'},
    prepare({title}) {
      return {title: title || 'Text', subtitle: 'Text'}
    },
  },
})

/** A pull quote, usually from the client. */
export const quote = defineType({
  name: 'quote',
  title: 'Quote',
  type: 'object',
  icon: BlockquoteIcon,
  fields: [
    defineField({name: 'text', title: 'Quote', type: 'text', rows: 4, validation: (rule) => rule.required()}),
    defineField({name: 'attribution', title: 'Attribution', type: 'string', description: 'Name and role, e.g. Jane Smith, Marketing Manager'}),
  ],
  preview: {
    select: {title: 'text', subtitle: 'attribution'},
  },
})

/** The ordered blocks that make up a project page. */
export const projectBody = defineType({
  name: 'projectBody',
  title: 'Project content',
  type: 'array',
  of: [
    defineArrayMember({type: 'mediaFull'}),
    defineArrayMember({type: 'mediaPair'}),
    defineArrayMember({type: 'textBlock'}),
    defineArrayMember({type: 'quote'}),
  ],
})
