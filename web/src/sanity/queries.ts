import { defineQuery } from 'groq';

/*
 * Fragments: the projections several queries share, written once. Sanity
 * TypeGen follows constants interpolated into a `defineQuery` string, so the
 * result types still come out per query (run `npm run typegen` at the repo
 * root after changing anything here).
 */

/** An image field with what SanityImage needs from its asset: the size and the blurred placeholder. */
const IMAGE = `{ ..., asset->{ _id, url, metadata{ lqip, dimensions{ width, height, aspectRatio } } } }`;

/** A media slot: an image or a Stream video. */
const MEDIA = `{ kind, image${IMAGE}, video{ streamId } }`;

/** The SEO tab. */
const SEO = `seo{ title, description }`;

/** What a project tile shows, and the head of its page. */
const PROJECT_CARD = `
  _id,
  title,
  "slug": slug.current,
  tagline,
  summary,
  "client": client->{ name },
  "services": services[]->{ _id, title },
  cover${MEDIA}`;

/** A whole project page: the card plus its search fields and the exports under it. */
const PROJECT_PAGE = `${PROJECT_CARD},
  ${SEO},
  body[]{
    _key,
    _type,
    _type == "mediaFull" => { media${MEDIA} },
    _type == "mediaPair" => { left${MEDIA}, right${MEDIA} }
  }`;

export const SETTINGS_QUERY = defineQuery(`*[_id == "siteSettings"][0]{
  tagline,
  menuText,
  email,
  careersEmail,
  phone,
  address,
  socials[]{ _key, label, url },
  ${SEO}
}`);

export const HOME_QUERY = defineQuery(`*[_id == "home"][0]{
  heroVideo,
  heroVideoMobile,
  ticker,
  ${SEO}
}`);

/** Every project in menu order, as tiles. Also where the project pages' addresses come from. */
export const PROJECTS_QUERY = defineQuery(`*[_type == "project"] | order(orderRank){${PROJECT_CARD}
}`);

/** One project page, for the editors' preview (one request per page viewed). */
export const PROJECT_QUERY = defineQuery(`*[_type == "project" && slug.current == $slug][0]{${PROJECT_PAGE}
}`);

/** Every project page at once, for the build: one request instead of one per page. */
export const PROJECT_PAGES_QUERY = defineQuery(`*[_type == "project" && defined(slug.current)] | order(orderRank){${PROJECT_PAGE}
}`);

export const GALLERY_QUERY = defineQuery(`*[_type == "galleryItem"] | order(orderRank){
  _id,
  image${IMAGE}
}`);

export const STUDIO_QUERY = defineQuery(`{
  "page": *[_id == "studio"][0]{
    aboutHeading,
    aboutHeadings,
    aboutBody,
    aboutHighlights,
    clientsIntro,
    clients,
    images[]${IMAGE},
    ${SEO}
  },
  "services": *[_type == "service"] | order(orderRank){ _id, title, description },
  "team": *[_type == "teamMember"] | order(orderRank){
    _id, name, role, bio,
    portrait${IMAGE}
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
