import {defineArrayMember, defineField, defineType} from 'sanity'
import {HomeIcon} from '@sanity/icons/Home'

/**
 * The home page: a full-screen hero (the showreel; the wordmark stands in
 * until it exists) and the ticker that runs along the bottom. Scrolling or
 * clicking goes to Projects. The hero image field went on 2 Nov (Ross): the
 * video's own first frame is the poster.
 */
export const home = defineType({
  name: 'home',
  title: 'Home',
  type: 'document',
  icon: HomeIcon,
  fields: [
    defineField({
      name: 'heroVideo',
      title: 'Hero video',
      type: 'string',
      description: 'Cloudflare Stream video ID for the showreel. It plays silently on a loop.',
      validation: (rule) => rule.regex(/^[a-f0-9]{32}$/i).error('A Stream ID is 32 hex characters'),
    }),
    defineField({
      name: 'heroVideoMobile',
      title: 'Hero video for phones',
      type: 'string',
      description: 'Cloudflare Stream video ID for the portrait (9:16) cut of the showreel. Screens taller than they are wide play this one instead. Leave empty to use the hero video everywhere.',
      validation: (rule) => rule.regex(/^[a-f0-9]{32}$/i).error('A Stream ID is 32 hex characters'),
    }),
    defineField({
      name: 'ticker',
      title: 'Ticker phrases',
      type: 'array',
      description: 'The phrases that scroll along the bar under the hero, e.g. Thinking made real. "Perth, Western Australia" follows each one.',
      of: [defineArrayMember({type: 'string'})],
      validation: (rule) => rule.min(1).warning('Add at least one phrase so the ticker has something to show'),
    }),
    defineField({name: 'seo', type: 'seo'}),
  ],
  preview: {
    prepare() {
      return {title: 'Home'}
    },
  },
})
