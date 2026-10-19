import {defineField, defineType} from 'sanity'
import {PlayIcon} from '@sanity/icons/Play'

/** Every video lives on Cloudflare Stream; Sanity only keeps the ID. */
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
      description: 'The 32-character ID from the Stream dashboard.',
      validation: (rule) => rule.required().regex(/^[a-f0-9]{32}$/i, {name: 'Stream ID', invert: false}).error('A Stream ID is 32 hex characters'),
    }),
    defineField({
      name: 'playback',
      title: 'Playback',
      type: 'string',
      options: {
        list: [
          {title: 'Silent loop (autoplays in the background)', value: 'loop'},
          {title: 'Player (click to play, with sound)', value: 'player'},
        ],
        layout: 'radio',
      },
      initialValue: 'loop',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {streamId: 'streamId', playback: 'playback'},
    prepare({streamId, playback}) {
      return {title: playback === 'player' ? 'Video player' : 'Video loop', subtitle: streamId ? `Stream ${streamId}` : 'No Stream ID yet', media: PlayIcon}
    },
  },
})
