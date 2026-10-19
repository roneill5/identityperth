import {defineField, defineType} from 'sanity'
import {ImagesIcon} from '@sanity/icons/Images'
import {ImageIcon} from '@sanity/icons/Image'
import {PlayIcon} from '@sanity/icons/Play'

/** A slot that holds either an image or a video. */
export const media = defineType({
  name: 'media',
  title: 'Media',
  type: 'object',
  icon: ImagesIcon,
  fields: [
    defineField({
      name: 'kind',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          {title: 'Image', value: 'image'},
          {title: 'Video', value: 'video'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'image',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'image',
      type: 'figure',
      hidden: ({parent}) => parent?.kind !== 'image',
    }),
    defineField({
      name: 'video',
      type: 'video',
      hidden: ({parent}) => parent?.kind !== 'video',
    }),
  ],
  preview: {
    select: {kind: 'kind', image: 'image', alt: 'image.alt'},
    prepare({kind, image, alt}) {
      const isVideo = kind === 'video'
      return {
        title: alt || (isVideo ? 'Video' : 'Image'),
        subtitle: isVideo ? 'Video' : 'Image',
        media: isVideo ? PlayIcon : (image ?? ImageIcon),
      }
    },
  },
})
