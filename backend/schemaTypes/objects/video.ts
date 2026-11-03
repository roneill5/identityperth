import {defineField, defineType} from 'sanity'
import {PlayIcon} from '@sanity/icons/Play'
import {StreamVideoInput} from '../../components/StreamVideoInput'

/** Every video lives on Cloudflare Stream and plays as a silent loop (the player-with-sound option went on 2 Nov, Ross); the CMS only keeps the ID, and the input uploads to Stream or picks from it (3 Nov). */
export const video = defineType({
  name: 'video',
  title: 'Video',
  type: 'object',
  icon: PlayIcon,
  fields: [
    defineField({
      name: 'streamId',
      title: 'Cloudflare Stream video ID',
      type: 'string',
      description: 'Upload a video, choose one already on Stream, or paste its 32-character ID.',
      components: {input: StreamVideoInput},
      validation: (rule) => rule.required().regex(/^[a-f0-9]{32}$/i).error('A Stream ID is 32 hex characters'),
    }),
  ],
  preview: {
    select: {streamId: 'streamId'},
    prepare({streamId}) {
      return {title: 'Video', subtitle: streamId ? `Stream ${streamId}` : 'No Stream ID yet', media: PlayIcon}
    },
  },
})
