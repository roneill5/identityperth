import {defineArrayMember, defineField, defineType} from 'sanity'
import {HomeIcon} from '@sanity/icons/Home'

/**
 * The home page: a full-screen hero (the showreel, with an image standing in
 * until it exists) and the ticker that runs along the bottom. Scrolling or
 * clicking goes to Projects.
 */
export const home = defineType({
  name: 'home',
  title: 'Home',
  type: 'document',
  icon: HomeIcon,
  groups: [
    {name: 'hero', title: 'Hero', default: true},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({
      name: 'heroVideo',
      title: 'Hero video',
      type: 'string',
      description: 'Cloudflare Stream video ID for the showreel. It plays silently on a loop. Leave empty to show the image.',
      group: 'hero',
      validation: (rule) => rule.regex(/^[a-f0-9]{32}$/i).error('A Stream ID is 32 hex characters'),
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero image',
      type: 'figure',
      description: 'Fills the screen until there is a video, and sits behind the video while it loads.',
      group: 'hero',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'ticker',
      title: 'Ticker phrases',
      type: 'array',
      description: 'The phrases that scroll along the bar under the hero, e.g. Thinking made real. "Perth, Western Australia" follows each one.',
      group: 'hero',
      of: [defineArrayMember({type: 'string'})],
      validation: (rule) => rule.min(1).warning('Add at least one phrase so the ticker has something to show'),
    }),
    defineField({name: 'seo', type: 'seo', group: 'seo'}),
  ],
  preview: {
    prepare() {
      return {title: 'Home'}
    },
  },
})
