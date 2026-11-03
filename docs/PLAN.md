# identityperth.com rebuild: plan

Status as of 20 October 2026. Written for Ross; share with Nick and Seth as needed.

## 1. What we are building

A portfolio site that behaves like forthandback.la and looks like the Figma design (ID-Website-2026 v1). The work leads; everything else builds confidence around it.

Three sections: Projects, Studio, Gallery. Thinking is hidden until stage two, after launch (Nick, 28 Oct). Contact lives in the menu and in the Studio accordion. No footer. Dark only. Legal pages (Terms & Conditions at `/terms`, 20 Oct) are unlisted: nothing links to them, the address is shared directly.

## 2. Stack (confirmed)

| Layer | Choice | Notes |
| --- | --- | --- |
| Framework | Astro 7, static | Every public page prerendered at build from published Sanity content. The Cloudflare adapter is there only for `/backend/*` and `/preview/*` |
| Styling | Tailwind 4 + tailwindcss-motion (Rombo) | Tokens in `web/src/styles/global.css` |
| Page transitions | Astro's client router (`<ClientRouter />`), GSAP choreography | Only `#page` and `#ticker` are swapped; sidebar and menu persist. Swup was dropped on 20 Oct |
| Motion | GSAP 3 (+ ScrollTrigger) | Reveals, slideshow, transitions. No Lenis: native scrolling, as on Forth & Back |
| CMS | Sanity (project `t2bz0tb2`), Studio built into the site at `/backend` | `@sanity/client` directly, not `@sanity/astro`: the latter pulls the whole Studio into the front end as required peers. `/studio` is the agency page, so the CMS lives at `/backend` |
| Hosting | Cloudflare Workers static assets plus a small Worker, `identityperth` | Free tier covers it; static requests are unlimited. The Worker runs only for the Studio's deep links and the draft preview |
| Fonts | Figtree, Shippori Mincho (serif, Seth's free stand-in for Capraia, 19 Oct), Hansief | All bundled; Capraia only if a webfont licence is bought |

Cost: $0 a month beyond the domain. Sanity free tier (20 seats, 100 GB bandwidth) and Cloudflare free tier.

## 3. Architecture

```
Studio (/backend) --publish--> Content Lake --webhook--> Workers Builds --build--> Astro --> static files + Worker (/backend, /preview)
Studio Preview tab ----------> /preview/* on the Worker: the same page bodies rendered from drafts
```

- `web/` fetches with `useCdn: false` and the `published` perspective, so a build always sees the latest published content.
- Publishing rebuilds the site: a Sanity webhook posts to a Workers Builds deploy hook (coded and documented 20 Oct, `backend/scripts/rebuild-webhook.mjs` and the README's Deploying steps; the dashboard side waits on the GitHub push and `wrangler login`). Until then, deploy by hand with `npm run build && npm run deploy` from the root.
- Draft preview (done 20 Oct): the Studio's Presentation tool opens `/preview/enable` with a one-time secret, which sets a cookie; `web/src/middleware.ts` then serves `/preview/*` from the same page bodies (`web/src/views/`) with a drafts client and stega overlays, `no-store` and `noindex`. Needs `SANITY_READ_TOKEN` as a Worker secret. The public site stays static and stega-free.

## 4. Content model

Pared back on 19 Oct to what the site renders. Documents (reorder by drag in the Studio where marked):

| Type | Fields | Drag order |
| --- | --- | --- |
| `project` | title, client (ref), slug, cover, tagline, summary, services (refs), body blocks (28 Oct: year, credits and seo removed) | yes |
| `galleryItem` | image (28 Oct: caption and project removed, nothing is written on the wall) | yes |
| `service` | title, description, image (optional, for the Studio column) | yes |
| `teamMember` | name, role, bio, portrait | yes |
| `client` | name | yes |
| `legalPage` | title, slug, updated, body blocks, seo | yes |

Singletons: `home` (heroVideo, heroVideoMobile, heroImage, ticker phrases, seo), `studio` (aboutHeading, aboutHeadings, aboutBody, aboutHighlights, clientsIntro, images, seo), `siteSettings` (tagline, menuText, email, careersEmail, phone, address, socials, seo). Clients have a name only: every published client is listed on the Studio page (28 Oct).

Project body blocks: `mediaFull` and `mediaPair` (two squares). Text blocks, quotes, captions and tile shapes went on 28 Oct: the pages are the exports in order.

Gone since 19 Oct: the home journey sections, hero slides and interval, the ticker's per-item detail (the location is part of the lockup), the article type (Thinking links to Substack), the featured flag, client logos and websites, service deliverables, team emails, and the Vision tool. `backend/scripts/tidy-cms.mjs` removes those fields from existing documents.

Video rule: everything on Cloudflare Stream, nothing uploaded to Sanity. A `video` object is a Stream ID plus loop or player; the home hero is a Stream ID on its own and plays silently on a loop over the hero image.

## 5. Page map

| Route | Template | Behaviour |
| --- | --- | --- |
| `/` | Home | Splash: one full-viewport hero (the showreel once it exists, the image until then), ticker bar along the bottom, no sidebar. Scrolling, swiping, pressing a key or clicking anywhere goes to Projects through the ticker curtain |
| `/projects` | Projects | Wide tile, pair of squares, wide, pair. Hover: slate wash (#64737a at 70%, from the Figma) with title, client, tagline and summary; slow zoom. Clicking grows the cover into the project hero |
| `/projects/[slug]` | Project | Hero media, meta (client, services), title, tagline, summary, the exports in order, next project tile |
| `/gallery` | Gallery | Three staggered columns, each tile at its own shape, filled in the order added into the shortest column (Nick, 28 Oct); no links and no captions shown (Belinda, 21 Oct); phones tap to open the image |
| `/studio` | Studio | Photo column beside a sticky accordion: About, Services, Team, Clients, Contact. The column shows only the open section's photos, so About ends the scroll (Belinda, 21 Oct); sections open by click, opening an item scrolls to its photo. Clients in one column. The About heading cycles through its phrases |
| Thinking | none | Hidden until stage two (Nick, 28 Oct): a blog archive and single template, promoted by EDM and socials. Add it back to `NAV` in `web/src/lib/site.ts` |
| `/404` | Not found | Copy, a link back to Projects, and Pong against the computer (back from the `mini-games` branch on 21 Oct, Belinda's pick) |
| `/terms`, other legal pages | Legal page | A simple document page on its own layout (`web/src/layouts/Plain.astro`, Ross, 28 Oct), in the site's colours, type and cursor: a bar with the lime lockup and Back to home, a contents column of the document's parts kept in view, the part being read lit lime and clicks scrolling smoothly (a Contents row on phones), the title and text, a hairline footer. No site sidebar, menu, client router or scroll effects. Each `legalPage` document is a page; none is linked from the menu |
| `/preview/*` | (Worker) | The Studio's Preview tab: every template above rendered from drafts, behind a cookie that only `/preview/enable` can set |

## 5a. Phones and tablets (19 Oct)

Forth and Back's phone experience was measured in depth (an agent teardown with screenshots and measurements, in the session scratchpad, 8,000 words) and the patterns worth keeping were rebuilt here: static 88px header with a 60px logo, fixed 45px bottom bar (Menu pill left, weather and clock right, safe-area aware), overlays above the bar with the page dimmed to 20% and blurred 24px, single-column tiles with always-visible caption rows (title left, client right) and 10px gaps inside 14px gutters, a 4:5 project hero, a three-across gallery with a tap-to-open image panel, and a one-screen Studio (swipeable 5:7 photo strip above an all-closed accordion that folds the strip while reading). Their defects were left out: the overflowing inline nav, no lazy loading, no safe-area insets, tablets as stretched phones (our tablets get two tile columns from 768px).

## 6. Motion spec

Taken from the Forth & Back teardown (`research/` folder, not in git) and adapted to the Figma.

| Moment | Spec |
| --- | --- |
| Home slideshow | 4 s per slide, 1.2 s crossfade, video plays only on the active slide, pauses when the tab is hidden |
| Home to any page | The page as it stands (hero frozen on a canvas, ticker running) is lifted into a fixed layer and slides up off the top while the next page rises into place beneath it, 0.8 s `power3.inOut`, the swap done before anything moves (29 Oct; the curtain's mid-way hold read as a freeze; a version that pinned the page in place to keep the showreel playing was rejected the same night) |
| Project tile to project | A copy of the cover is pinned where the tile was, the page fades (0.3 s), the copy grows into the hero (0.9 s `expo.inOut`) while the new page fades in, and it is removed once the hero has loaded |
| Any other route | 0.2 s fade out, 0.35 s fade in with an 8 px rise. Links prefetch as they scroll into view |
| Menu | Overlay fades 0.35 s, IDENTITY unfolds from the ID mark letter by letter (55 ms stagger), the four section names rise in with a 60 ms stagger, contact column fades after. Escape closes. Scroll locked |
| Logo hover | ENTITY draws out of the mark letter by letter (each letter its own SVG path) and the roundel lands at the end: wipe, fade and a short slide per letter, 35 ms apart on an expo ease, about 0.6 s; one GSAP timeline, reversed on leave. The mark stays still and nothing shrinks; the word may run over the column edge (Belinda, 21 Oct). The menu opening plays the same reveal |
| Scroll reveals | `data-reveal`: fade and 24 px rise, once, when 90% down the viewport. `data-reveal-group` reveals children in batches as each enters (70 ms stagger within a batch) |
| Images | Every Sanity image blurs up from its LQIP when it loads (0.7 s), so nothing pops in. Since 20 Oct the files are built into the site as WebP rather than served from Sanity's CDN |
| Project tiles | No zoom (dropped 20 Oct): the cover holds still while the slate wash and text fade in over 0.3 s; project and client sit bottom left above the tagline and summary (21 Oct) |
| Studio | Heading phrases swap one word at a time every 3.4 s; scrolling a photo through the middle opens its section; opening a section scrolls its photo to the middle; panels slide open and shut (0.45 s) instead of snapping |
| Loop videos | Play only while on screen (IntersectionObserver), muted, inline, poster first |
| Ticker | CSS marquee, speed scales with length, keeps moving under the mouse (Belinda, 21 Oct) |
| Reduced motion | Every animation collapses to an instant state change |

Still to design with Seth: the "A clearer Identity" moment Nick described (type or imagery that starts unresolved and resolves on scroll). The hooks exist (`data-reveal`, GSAP context per page); the idea needs a design first.

## 6a. Cursor and mini games

The cursor on mouse devices is a hairline lime ring (the site's own icon ring) as the pointer with a lime dot drifting behind; over anything clickable the ring opens with a plus inside and the dot fills it (21 Oct, Belinda's ask, studioscotts.com.au as the starting point, then made our own). Pong plays on the 404. The Joondalup weather and Perth clock were removed on 21 Oct at Belinda's request; the dog and Comic Sans mode stay on the `mini-games` branch. Ross's rule for anything that comes back: visual or playable, never typed.

## 7. Phases

| Phase | Scope | State |
| --- | --- | --- |
| 0 Scaffold | Repo, Node 22.23, Astro, Studio, tokens, brand SVGs | Done |
| 1 Shell and templates | Sidebar, menu, ticker, all routes, image pipeline, Swup transitions, reveals | Done |
| 2 Content | Schema deployed, Studio at `/backend`. Published content mirrors the Figma for review (three design projects, six design gallery tiles, Studio photos, grey placeholders elsewhere); the 22 v1 projects sit as drafts | Done, real content to come |
| 3 Design pass | Brand fonts in, every page measured against the Figma (19 Oct) and corrected: Studio column widths, row pitch, hairlines, type; menu nav position and contact column; ticker sizes and gaps; tile hover wash and type; gallery captions; sidebar nav position. Still open: the clearer-Identity moment | Mostly done |
| 4 Hosting | GitHub repo, Workers Builds, Sanity webhook, draft preview, domain cut-over plan | Preview and the publish-to-deploy pipeline are coded and documented (README, Deploying). Waiting on Ross: GitHub push, `wrangler login`, the Worker and deploy hook in the dashboard, the preview token |
| 5 Launch | SEO (sitemap), analytics (GA4 + GSC), redirects from old URLs, QA on devices, accessibility pass | Share images done 20 Oct: a rendered card per page (`web/scripts/og.mjs`). Rest not started |

## 8. Open questions

1. Fonts: settled for now. Shippori Mincho stands in for Capraia (Seth, 19 Oct); buy the Capraia webfont licence only if the team wants the original back.
2. Home: splash, decided. The journey idea from Nick's email is parked; the schema for it was removed on 19 Oct.
3. Video: Cloudflare Stream, decided 19 Oct. Upload the showreel there and paste its ID into Home.
4. Domain: keep identityperth.com as primary, redirect .com.au and .au. Confirm.
5. GitHub: new repo, or a new branch on `roneill5/identity-perth`?
6. Thinking: hidden for launch; stage two is a blog archive and single template (Nick, 28 Oct). Bring the article pages back and add Thinking to `NAV` when there is something to publish.
8. Studio photos: the design's column is 5:7 portrait crops with the first one in black and white; the current shoot is in colour. Decide whether to shoot or convert.
7. Testimonials: dropped on 20 Oct. They were never in the design, so the type and the three v1 quotes are gone. The client list was halved the same day to the 20 strongest names (current web clients, the big brands, the institutions); the other 20 are unpublished, not deleted, so any can be published back.
