// Objects
import {seo} from './objects/seo'
import {figure} from './objects/figure'
import {video} from './objects/video'
import {media} from './objects/media'
import {blockContent} from './objects/blockContent'

// Blocks
import {mediaFull, mediaPair, textBlock, quote, projectBody} from './blocks/projectBlocks'

// Documents
import {project} from './documents/project'
import {galleryItem} from './documents/galleryItem'
import {service} from './documents/service'
import {teamMember} from './documents/teamMember'
import {client} from './documents/client'
import {testimonial} from './documents/testimonial'

// Singletons
import {home} from './singletons/home'
import {studio} from './singletons/studio'
import {siteSettings} from './singletons/siteSettings'

export const schemaTypes = [
  // objects
  seo,
  figure,
  video,
  media,
  blockContent,
  // blocks
  mediaFull,
  mediaPair,
  textBlock,
  quote,
  projectBody,
  // documents
  project,
  galleryItem,
  service,
  teamMember,
  client,
  testimonial,
  // singletons
  home,
  studio,
  siteSettings,
]
