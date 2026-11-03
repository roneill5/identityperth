import { defineQuery } from 'groq';

/*
 * Every query is a static string so Sanity TypeGen can generate result types
 * (run `npm run typegen` at the repo root). Image and media projections are
 * repeated inline for the same reason: TypeGen cannot follow string
 * interpolation.
 */

export const SETTINGS_QUERY = defineQuery(`*[_id == "siteSettings"][0]{
  tagline,
  menuText,
  email,
  careersEmail,
  phone,
  address,
  socials[]{ _key, label, url },
  seo{ title, description }
}`);

export const HOME_QUERY = defineQuery(`*[_id == "home"][0]{
  heroVideo,
  heroVideoMobile,
  ticker,
  seo{ title, description }
}`);

export const PROJECTS_QUERY = defineQuery(`*[_type == "project"] | order(orderRank){
  _id,
  title,
  "slug": slug.current,
  tagline,
  summary,
  "client": client->{ name },
  "services": services[]->{ _id, title },
  cover{ kind, image{ ..., asset->{ _id, url, metadata{ lqip, dimensions{ width, height, aspectRatio } } } }, video{ streamId } }
}`);

export const PROJECT_SLUGS_QUERY = defineQuery(`*[_type == "project" && defined(slug.current)]{
  "slug": slug.current
}`);

export const PROJECT_QUERY = defineQuery(`*[_type == "project" && slug.current == $slug][0]{
  _id,
  title,
  "slug": slug.current,
  tagline,
  summary,
  seo{ title, description },
  "client": client->{ name },
  "services": services[]->{ _id, title },
  cover{ kind, image{ ..., asset->{ _id, url, metadata{ lqip, dimensions{ width, height, aspectRatio } } } }, video{ streamId } },
  body[]{
    _key,
    _type,
    _type == "mediaFull" => {
      media{
        kind,
        image{ ..., asset->{ _id, url, metadata{ lqip, dimensions{ width, height, aspectRatio } } } },
        video{ streamId }
      }
    },
    _type == "mediaPair" => {
      left{
        kind,
        image{ ..., asset->{ _id, url, metadata{ lqip, dimensions{ width, height, aspectRatio } } } },
        video{ streamId }
      },
      right{
        kind,
        image{ ..., asset->{ _id, url, metadata{ lqip, dimensions{ width, height, aspectRatio } } } },
        video{ streamId }
      }
    }
  }
}`);

export const GALLERY_QUERY = defineQuery(`*[_type == "galleryItem"] | order(orderRank){
  _id,
  image{ ..., asset->{ _id, url, metadata{ lqip, dimensions{ width, height, aspectRatio } } } }
}`);

export const STUDIO_QUERY = defineQuery(`{
  "page": *[_id == "studio"][0]{
    aboutHeading,
    aboutHeadings,
    aboutBody,
    aboutHighlights,
    clientsIntro,
    clients,
    images[]{ ..., asset->{ _id, url, metadata{ lqip, dimensions{ width, height, aspectRatio } } } },
    seo{ title, description }
  },
  "services": *[_type == "service"] | order(orderRank){ _id, title, description },
  "team": *[_type == "teamMember"] | order(orderRank){
    _id, name, role, bio,
    portrait{ ..., asset->{ _id, url, metadata{ lqip, dimensions{ width, height, aspectRatio } } } }
  }
}`);

/** The legal pages, for the static paths. They are unlisted: nothing links to them. */
export const LEGAL_PAGES_QUERY = defineQuery(`*[_type == "legalPage" && defined(slug.current)] | order(orderRank){
  title,
  "slug": slug.current
}`);

export const LEGAL_PAGE_QUERY = defineQuery(`*[_type == "legalPage" && slug.current == $slug][0]{
  title,
  "slug": slug.current,
  body
}`);
