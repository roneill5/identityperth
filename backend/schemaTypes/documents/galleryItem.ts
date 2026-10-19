import {defineField, defineType} from 'sanity'
import {orderRankField, orderRankOrdering} from '@sanity/orderable-document-list'
import {ImageIcon} from '@sanity/icons/Image'

/** One tile in the Gallery grid. */
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
    defineField({
      name: 'project',
      title: 'Project',
      type: 'reference',
      to: [{type: 'project'}],
      description: 'Optional. Adds the client name to the caption shown on hover.',
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'string',
      description: 'Shown on hover. Falls back to the project name.',
    }),
  ],
  preview: {
    select: {caption: 'caption', alt: 'image.alt', project: 'project.title', client: 'project.client.name', media: 'image'},
    prepare({caption, alt, project, client, media}) {
      return {
        title: caption || project || alt || 'Gallery image',
        subtitle: [project, client].filter(Boolean).join(' · '),
        media,
      }
    },
  },
})
