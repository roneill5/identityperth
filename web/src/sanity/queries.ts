import { defineQuery } from 'groq';

/*
 * Every query is a static string so Sanity TypeGen can generate result types
 * (run `npm run typegen` at the repo root). Image and media projections are
 * repeated inline for the same reason: TypeGen cannot follow string
 * interpolation.
 */

export const SETTINGS_QUERY = defineQuery(`*[_id == "siteSettings"][0]{
  siteName,
  tagline,
  menuText,
  email,
  careersEmail,
  phone,
  address,
  socials[]{ _key, label, url },
  seo{ title, description, image{ asset->{ url } } }
}`);

export const HOME_QUERY = defineQuery(`*[_id == "home"][0]{
  heroVideo,
  heroImage{ ..., asset->{ _id, url, metadata{ lqip, dimensions{ width, height, aspectRatio } } } },
  ticker,
  seo{ title, description, image{ asset->{ url } } }
}`);

export const PROJECTS_QUERY = defineQuery(`*[_type == "project"] | order(orderRank){
  _id,
  title,
  "slug": slug.current,
  tagline,
  summary,
  year,
  "client": client->{ name },
  "services": services[]->{ _id, title },
  cover{ kind, image{ ..., asset->{ _id, url, metadata{ lqip, dimensions{ width, height, aspectRatio } } } }, video{ streamId, playback } }
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
  year,
  orderRank,
  "client": client->{ name, website },
  "services": services[]->{ _id, title },
  cover{ kind, image{ ..., asset->{ _id, url, metadata{ lqip, dimensions{ width, height, aspectRatio } } } }, video{ streamId, playback } },
  body[]{
    _key,
    _type,
    _type == "mediaFull" => {
      caption,
      media{
        kind,
        image{ ..., asset->{ _id, url, metadata{ lqip, dimensions{ width, height, aspectRatio } } } },
        video{ streamId, playback }
      }
    },
    _type == "mediaPair" => {
      shape,
      left{
        kind,
        image{ ..., asset->{ _id, url, metadata{ lqip, dimensions{ width, height, aspectRatio } } } },
        video{ streamId, playback }
      },
      right{
        kind,
        image{ ..., asset->{ _id, url, metadata{ lqip, dimensions{ width, height, aspectRatio } } } },
        video{ streamId, playback }
      }
    },
    _type == "textBlock" => { heading, body },
    _type == "quote" => { text, attribution }
  },
  credits[]{ _key, role, name },
  seo{ title, description, image{ asset->{ url } } }
}`);

export const GALLERY_QUERY = defineQuery(`*[_type == "galleryItem"] | order(orderRank){
  _id,
  caption,
  image{ ..., asset->{ _id, url, metadata{ lqip, dimensions{ width, height, aspectRatio } } } },
  "project": project->{ title, "slug": slug.current, "client": client->{ name } }
}`);

export const STUDIO_QUERY = defineQuery(`{
  "page": *[_id == "studio"][0]{
    aboutHeading,
    aboutHeadings,
    aboutBody,
    aboutHighlights,
    clientsIntro,
    images[]{ ..., asset->{ _id, url, metadata{ lqip, dimensions{ width, height, aspectRatio } } } },
    clientsImages[]{ ..., asset->{ _id, url, metadata{ lqip, dimensions{ width, height, aspectRatio } } } },
    contactImages[]{ ..., asset->{ _id, url, metadata{ lqip, dimensions{ width, height, aspectRatio } } } },
    seo{ title, description, image{ asset->{ url } } }
  },
  "services": *[_type == "service"] | order(orderRank){
    _id, title, description,
    "image": coalesce(
      image{ ..., asset->{ _id, url, metadata{ lqip, dimensions{ width, height, aspectRatio } } } },
      *[_type == "project" && references(^._id)] | order(orderRank)[0].cover{ ..., asset->{ _id, url, metadata{ lqip, dimensions{ width, height, aspectRatio } } } }
    )
  },
  "team": *[_type == "teamMember"] | order(orderRank){
    _id, name, role, bio,
    portrait{ ..., asset->{ _id, url, metadata{ lqip, dimensions{ width, height, aspectRatio } } } }
  },
  "clients": *[_type == "client"] | order(orderRank){ _id, name },
  "testimonials": *[_type == "testimonial"] | order(orderRank){ _id, quote, name, role, "client": client->{ name } }
}`);
