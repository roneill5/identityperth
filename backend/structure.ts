import type {StructureResolver} from 'sanity/structure'
import {orderableDocumentListDeskItem} from '@sanity/orderable-document-list'
import {HomeIcon} from '@sanity/icons/Home'
import {PresentationIcon} from '@sanity/icons/Presentation'
import {CogIcon} from '@sanity/icons/Cog'
import {ImagesIcon} from '@sanity/icons/Images'
import {ImageIcon} from '@sanity/icons/Image'
import {SparklesIcon} from '@sanity/icons/Sparkles'
import {UsersIcon} from '@sanity/icons/Users'
import {CaseIcon} from '@sanity/icons/Case'
import {CommentIcon} from '@sanity/icons/Comment'

/** Document types that exist exactly once, opened directly by a fixed ID. */
export const SINGLETONS = new Set(['home', 'studio', 'siteSettings'])

export const structure: StructureResolver = (S, context) =>
  S.list()
    .title('Identity')
    .items([
      S.listItem()
        .title('Home')
        .icon(HomeIcon)
        .child(S.document().schemaType('home').documentId('home').title('Home')),
      S.listItem()
        .title('Studio')
        .icon(PresentationIcon)
        .child(S.document().schemaType('studio').documentId('studio').title('Studio')),

      S.divider(),

      orderableDocumentListDeskItem({type: 'project', title: 'Projects', icon: ImagesIcon, S, context}),
      orderableDocumentListDeskItem({type: 'galleryItem', title: 'Gallery', icon: ImageIcon, S, context}),

      S.divider(),

      orderableDocumentListDeskItem({type: 'service', title: 'Services', icon: SparklesIcon, S, context}),
      orderableDocumentListDeskItem({type: 'teamMember', title: 'Team', icon: UsersIcon, S, context}),
      orderableDocumentListDeskItem({type: 'client', title: 'Clients', icon: CaseIcon, S, context}),
      orderableDocumentListDeskItem({type: 'testimonial', title: 'Client comments', icon: CommentIcon, S, context}),

      S.divider(),

      S.listItem()
        .title('Site settings')
        .icon(CogIcon)
        .child(S.document().schemaType('siteSettings').documentId('siteSettings').title('Site settings')),
    ])
