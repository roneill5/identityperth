# identityperth.com rebuild: plan

Status as of 20 October 2026. Written for Ross; share with Nick and Seth as needed.

## 1. What we are building

A portfolio site that behaves like forthandback.la and looks like the Figma design (ID-Website-2026 v1). The work leads; everything else builds confidence around it.

Four sections: Projects, Studio, Gallery, Thinking (a link to Substack until there is writing to publish). Contact lives in the menu and in the Studio accordion. No footer. Dark only.

## 2. Stack (confirmed)

| Layer | Choice | Notes |
| --- | --- | --- |
| Framework | Astro 7, static | Every public page prerendered at build from published Sanity content. The Cloudflare adapter is there only for `/backend/*` and `/preview/*` |
| Styling | Tailwind 4 + tailwindcss-motion (Rombo) | Tokens in `web/src/styles/global.css` |
| Page transitions | Swup 4 + JS plugin + preload plugin | Sidebar and menu persist outside `#swup` |
| Motion | GSAP 3 (+ ScrollTrigger) | Reveals, slideshow, transitions. No Lenis: native scrolling, as on Forth & Back |
| CMS | Sanity (project `t2bz0tb2`), Studio built into the site at `/backend` | `@sanity/client` directly, not `@sanity/astro`: the latter pulls the whole Studio into the front end as required peers. `/studio` is the agency page, so the CMS lives at `/backend` |
| Hosting | Cloudflare Workers static assets plus a small Worker, `identityperth-web` | Free tier covers it; static requests are unlimited. The Worker runs only for the Studio's deep links and the draft preview |
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
| `project` | title, client (ref), slug, tagline, summary, cover, coverVideo, year, services (refs), body blocks, credits, seo | yes |
| `galleryItem` | image, caption, project (ref, optional, adds the client name to the caption) | yes |
| `service` | title, description, image (optional, for the Studio column) | yes |
| `teamMember` | name, role, bio, portrait | yes |
| `client` | name | yes |
| `testimonial` | quote, name, role, client (ref) | yes |

Singletons: `home` (heroVideo, heroImage, ticker phrases, seo), `studio` (aboutHeading, aboutHeadings, aboutBody, aboutHighlights, clientsIntro, images, clientsImages, contactImages, seo), `siteSettings` (name, tagline, menu text, emails, phone, address, socials, default SEO).

Project body blocks: `mediaFull`, `mediaPair` (square, portrait or landscape tiles), `textBlock`, `quote`.

Gone since 19 Oct: the home journey sections, hero slides and interval, the ticker's per-item detail (the location is part of the lockup), the article type (Thinking links to Substack), the featured flag, client logos and websites, service deliverables, team emails, and the Vision tool. `backend/scripts/tidy-cms.mjs` removes those fields from existing documents.

Video rule: everything on Cloudflare Stream, nothing uploaded to Sanity. A `video` object is a Stream ID plus loop or player; the home hero is a Stream ID on its own and plays silently on a loop over the hero image.

## 5. Page map

| Route | Template | Behaviour |
| --- | --- | --- |
| `/` | Home | Splash: one full-viewport hero (the showreel once it exists, the image until then), ticker bar along the bottom, no sidebar. Scrolling, swiping, pressing a key or clicking anywhere goes to Projects through the ticker curtain |
| `/projects` | Projects | Wide tile, pair of squares, wide, pair. Hover: slate wash (#64737a at 70%, from the Figma) with title, client, tagline and summary; slow zoom. Clicking grows the cover into the project hero |
| `/projects/[slug]` | Project | Hero media, meta (client, year, services), title, tagline, summary, body blocks, credits, next project tile |
| `/gallery` | Gallery | Three across in the order added (rows align when ratios match, as in the design), no links. Hover shows the caption on a lime bar |
| `/studio` | Studio | Photo column beside a sticky accordion: About, Services, Team, Clients, Contact. The column follows the accordion's order; scrolling a photo through the middle opens its section, opening a section scrolls to its photo. The About heading cycles through its phrases |
| Thinking | (external) | Links to Substack in a new tab until there is writing to publish (`THINKING_URL` in `web/src/lib/site.ts`). The article schema and queries stay for later |
| `/404` | Not found | Copy and a link back to Projects (Pong lives on the `mini-games` branch) |
| `/preview/*` | (Worker) | The Studio's Preview tab: every template above rendered from drafts, behind a cookie that only `/preview/enable` can set |

## 5a. Phones and tablets (19 Oct)

Forth and Back's phone experience was measured in depth (an agent teardown with screenshots and measurements, in the session scratchpad, 8,000 words) and the patterns worth keeping were rebuilt here: static 88px header with a 60px logo, fixed 45px bottom bar (Menu pill left, weather and clock right, safe-area aware), overlays above the bar with the page dimmed to 20% and blurred 24px, single-column tiles with always-visible caption rows (title left, client right) and 10px gaps inside 14px gutters, a 4:5 project hero, a three-across gallery with a tap-to-open image panel, and a one-screen Studio (swipeable 5:7 photo strip above an all-closed accordion that folds the strip while reading). Their defects were left out: the overflowing inline nav, no lazy loading, no safe-area insets, tablets as stretched phones (our tablets get two tile columns from 768px).

## 6. Motion spec

Taken from the Forth & Back teardown (`research/` folder, not in git) and adapted to the Figma.

| Moment | Spec |
| --- | --- |
| Home slideshow | 4 s per slide, 1.2 s crossfade, video plays only on the active slide, pauses when the tab is hidden |
| Home to any page | The ticker screen rises as a curtain (0.7 s `power3.inOut`) until the ticker sits along the top edge, the new page is swapped in beneath it, and after a 120 ms beat the curtain carries on up and away (0.9 s). No fade to black |
| Project tile to project | A copy of the cover is pinned where the tile was, the page fades (0.3 s), the copy grows into the hero (0.9 s `expo.inOut`) while the new page fades in, and it is removed once the hero has loaded |
| Any other route | 0.3 s fade out, 0.5 s fade in with a 12 px rise. Links preload on hover |
| Menu | Overlay fades 0.35 s, IDENTITY unfolds from the ID mark letter by letter (55 ms stagger), the four section names rise in with a 60 ms stagger, contact column fades after. Escape closes. Scroll locked |
| Logo hover | ENTITY unfolds one letter at a time (60 ms per letter) while the lockup scales to 0.62 so the word fits inside the column; folds back last letter first |
| Scroll reveals | `data-reveal`: fade and 24 px rise, once, when 90% down the viewport. `data-reveal-group` reveals children in batches as each enters (70 ms stagger within a batch) |
| Images | Every Sanity image blurs up from its LQIP when it loads (0.7 s), so nothing pops in |
| Project tiles | Zoom to 1.05 over 1.6 s (0.7 s back), slate wash and text fade in over 0.3 s. Native loop videos play on hover |
| Studio | Heading phrases swap one word at a time every 3.4 s; scrolling a photo through the middle opens its section; opening a section scrolls its photo to the middle; panels slide open and shut (0.45 s) instead of snapping |
| Loop videos | Play only while on screen (IntersectionObserver), muted, inline, poster first |
| Ticker | CSS marquee, speed scales with length, pauses on hover |
| Reduced motion | Every animation collapses to an instant state change |

Still to design with Seth: the "A clearer Identity" moment Nick described (type or imagery that starts unresolved and resolves on scroll). The hooks exist (`data-reveal`, GSAP context per page); the idea needs a design first.

## 6a. Widgets and mini games

Live on `main`: Joondalup weather and a Perth clock beside the menu (Open-Meteo, Fluent icons, still). The mini games (the dog's living room along the bottom of Projects, Studio and Gallery, keyboard Pong in the 404, Comic Sans mode) are on the `mini-games` branch, taken off `main` on 19 Oct. Earlier eggs (achievements, terminal, duck hunt, screensaver) were removed before anything was committed; Ross's rule for anything that comes back: visual or playable, never typed.

## 7. Phases

| Phase | Scope | State |
| --- | --- | --- |
| 0 Scaffold | Repo, Node 22.23, Astro, Studio, tokens, brand SVGs | Done |
| 1 Shell and templates | Sidebar, menu, ticker, all routes, image pipeline, Swup transitions, reveals | Done |
| 2 Content | Schema deployed, Studio at `/backend`. Published content mirrors the Figma for review (three design projects, six design gallery tiles, Studio photos, grey placeholders elsewhere); the 22 v1 projects sit as drafts | Done, real content to come |
| 3 Design pass | Brand fonts in, every page measured against the Figma (19 Oct) and corrected: Studio column widths, row pitch, hairlines, type; menu nav position and contact column; ticker sizes and gaps; tile hover wash and type; gallery captions; sidebar nav position. Still open: the clearer-Identity moment | Mostly done |
| 4 Hosting | GitHub repo, Workers Builds, Sanity webhook, draft preview, domain cut-over plan | Preview and the publish-to-deploy pipeline are coded and documented (README, Deploying). Waiting on Ross: GitHub push, `wrangler login`, the Worker and deploy hook in the dashboard, the preview token |
| 5 Launch | SEO (sitemap, OG images), analytics (GA4 + GSC), redirects from old URLs, QA on devices, accessibility pass | Not started |

## 8. Open questions

1. Fonts: settled for now. Shippori Mincho stands in for Capraia (Seth, 19 Oct); buy the Capraia webfont licence only if the team wants the original back.
2. Home: splash, decided. The journey idea from Nick's email is parked; the schema for it was removed on 19 Oct.
3. Video: Cloudflare Stream, decided 19 Oct. Upload the showreel there and paste its ID into Home.
4. Domain: keep identityperth.com as primary, redirect .com.au and .au. Confirm.
5. GitHub: new repo, or a new branch on `roneill5/identity-perth`?
6. Thinking: links to Substack for now (`THINKING_URL`). Swap in the real publication URL when it exists, and bring the article pages back when there is something to publish.
8. Studio photos: the design's column is 5:7 portrait crops with the first one in black and white; the current shoot is in colour. Decide whether to shoot or convert.
7. Testimonials and Google reviews: Ross's email suggested asking existing clients. Decide the ask and the wording.
