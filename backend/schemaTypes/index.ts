// Objects
import {seo} from './objects/seo'
import {figure} from './objects/figure'
import {video} from './objects/video'
import {media} from './objects/media'
import {blockContent} from './objects/blockContent'

// Blocks
import {mediaFull, mediaPair, projectBody} from './blocks/projectBlocks'

// Documents
import {project} from './documents/project'
import {galleryItem} from './documents/galleryItem'
import {service} from './documents/service'
import {teamMember} from './documents/teamMember'
import {client} from './documents/client'
import {legalPage} from './documents/legalPage'

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
  projectBody,
  // documents
  project,
  galleryItem,
  service,
  teamMember,
  client,
  legalPage,
  // singletons
  home,
  studio,
  siteSettings,
]
