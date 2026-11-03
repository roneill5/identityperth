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
import {DocumentTextIcon} from '@sanity/icons/DocumentText'

/** Document types that exist exactly once, opened directly by a fixed ID. */
export const SINGLETONS = new Set(['home', 'studio', 'siteSettings'])

export const structure: StructureResolver = (S, context) =>
  S.list()
    .title('Identity')
    .items([
      // One entry per page of the site, in the site's own order.
      S.listItem()
        .title('Home')
        .icon(HomeIcon)
        .child(S.document().schemaType('home').documentId('home').title('Home')),

      orderableDocumentListDeskItem({type: 'project', title: 'Projects', icon: ImagesIcon, S, context}),

      // The Studio page and everything its accordion lists.
      S.listItem()
        .title('Studio')
        .icon(PresentationIcon)
        .child(
          S.list()
            .title('Studio')
            .items([
              S.listItem()
                .title('Studio page')
                .icon(PresentationIcon)
                .child(S.document().schemaType('studio').documentId('studio').title('Studio page')),
              S.divider(),
              orderableDocumentListDeskItem({type: 'service', title: 'Services', icon: SparklesIcon, S, context}),
              orderableDocumentListDeskItem({type: 'teamMember', title: 'Team', icon: UsersIcon, S, context}),
              orderableDocumentListDeskItem({type: 'client', title: 'Clients', icon: CaseIcon, S, context}),
            ]),
        ),

      orderableDocumentListDeskItem({type: 'galleryItem', title: 'Gallery', icon: ImageIcon, S, context}),

      S.divider(),

      orderableDocumentListDeskItem({type: 'legalPage', title: 'Legal pages', icon: DocumentTextIcon, S, context}),

      S.listItem()
        .title('Site settings')
        .icon(CogIcon)
        .child(S.document().schemaType('siteSettings').documentId('siteSettings').title('Site settings')),
    ])
