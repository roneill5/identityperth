# identityperth.com

The 2026 rebuild of the Identity website. Two apps side by side:

```
identityperth/
├── web/       Astro site (Tailwind, Swup, GSAP) → static files on Cloudflare Workers
└── backend/   Sanity Studio (content editing) → built into the site at /backend
```

The CMS lives at `/backend` because `/studio` is the agency's own page.

Design: Figma "Identity-Duplicate" (ID-Website-2026 v1). Reference for behaviour: forthandback.la.

## Prerequisites

- Node 22.22 or newer. The repo has an `.nvmrc`, so `nvm use` picks the right one.
- A Sanity login for anything that talks to the project (`npx sanity login`, once).
- A Cloudflare login for deploys (`npx wrangler login`, once, inside `web/`).

## Everyday commands

Run from the repo root:

| Command | What it does |
| --- | --- |
| `npm run dev` | Astro dev server at http://localhost:4321 |
| `npm run dev:studio` | Sanity Studio at http://localhost:3333/backend |
| `npm run build` | Builds the Studio into `web/public/backend`, then the site into `web/dist` (the Studio ends up at `/backend`) |
| `npm run deploy` | `wrangler deploy` from `web/` (needs `npx wrangler login` once) |
| `npm run typegen` | Regenerates `web/sanity.types.ts` from the schema and the GROQ queries |
| `npm run install:all` | `npm install` in both apps |

The first time, run `npm run install:all`.

## What is in the CMS right now

The published content mirrors the Figma for review: the three projects from the Projects page (So Dam Pink & Perky, Kindred Magazine, Pelvic Physio Collective) with the design's images, six placeholder projects with lorem text and grey covers, the six gallery tiles from page 1 plus grey placeholders, and the Studio column photos from pages 3 and 4. The 22 projects imported from the old site are parked as drafts in the Studio and can be published whenever they are wanted. `backend/scripts/design-content.mjs` is what set this up; `npm run seed:build` + `seed:import` would put the full v1 import back.

## What editors see in the Studio

Home (hero video or image, ticker phrases, SEO), Studio (About copy and headings, highlights, Clients intro, the photo column, SEO), Projects, Gallery, Services, Team, Clients, Client comments, and Site settings (name, tagline, menu text, emails, phone, address, socials, default SEO). Nothing else: the schema was pared back on 19 October to what the site actually renders. `backend/scripts/tidy-cms.mjs` strips any leftover fields from old documents and is safe to re-run.

## How content flows

1. Editors publish in the Studio (Sanity hosts the content).
2. A build pulls everything that is published (`web/src/sanity/queries.ts`) and renders static pages.
3. Cloudflare Workers serves `web/dist` as static assets. The only code that runs on request is `web/worker/index.ts`, and only for `/backend/*`: it hands the Studio's deep links (`/backend/structure/...`) to the Studio's index page. Sanity CORS already allows `localhost:4321`, `127.0.0.1:4321`, `identityperth.com` and `www.identityperth.com`; add the `workers.dev` preview origin with `npx sanity cors add <origin> --credentials` if you use it.

A Sanity webhook will trigger a rebuild on publish once hosting is wired up (see Deploying). Until then, deploy by hand.

## Content model (`studio/schemaTypes`)

| Type | Used for |
| --- | --- |
| `home` (single) | Hero media, ticker phrases, and the ordered home page sections |
| `studio` (single) | About copy, highlights, studio photography |
| `siteSettings` (single) | Site name, tagline, menu text, contact details, socials, default SEO |
| `project` | A piece of work: cover, tagline, summary, services, body blocks, credits |
| `galleryItem` | One tile on the Gallery page, optionally linked to a project |
| `service` | The capability list (Insight & Strategy, Brand & Identity, ...) |
| `teamMember` | People on the Studio page |
| `client` | Client names and logos |
| `testimonial` | Client comments |
| `article` | Thinking posts |

Projects, gallery items, services, team, clients and testimonials are drag-to-reorder lists in the Studio. The order there is the order on the site.

Video is not uploaded to Sanity except for short silent loops under 5 MB. Longer video goes on Cloudflare Stream or Vimeo and only the ID or URL is stored.

## Seeding content from the old site

The archived v1 site (`~/Sites/identityperth-v1`) has 22 project write-ups with imagery. To load them into Sanity:

```sh
cd studio
npx sanity login            # once
npm run seed:build          # writes seed/v1.ndjson (images referenced by path)
npm run seed:import         # uploads documents and assets to the production dataset
```

`--replace` is on, so re-running overwrites those same documents and nothing else.

## Fonts

The design uses Capraia (serif), Hansief (condensed caps) and Figtree (body). Figtree is bundled. Capraia and Hansief need their webfont files from the design team; until then Fraunces and Bebas Neue stand in. To swap: drop the files in `web/src/assets/fonts/`, add `@font-face` rules in `web/src/styles/global.css`, and the `--font-serif` and `--font-display` tokens already point at the real names.

## Deploying

Site (static assets on Cloudflare Workers, Worker name `identityperth-web`):

```sh
cd web
npm run build
npx wrangler deploy
```

Studio (Sanity hosting):

```sh
cd studio
npx sanity schemas deploy    # also needed before the Sanity MCP or AI tools can see the schema
npx sanity deploy            # choose a hostname the first time, e.g. identityperth.sanity.studio
```

Do not deploy to the Worker named `identity-perth`. That one belongs to the archived v1 site.

## Where things live in `web/`

```
src/
├── layouts/Base.astro          head, sidebar, #swup container, menu overlay
├── components/                 Sidebar, MenuOverlay, Ticker, ProjectTile, SanityImage, Media, RichText...
├── pages/                      index, projects/, gallery, studio, 404 (Thinking links out to Substack for now: `THINKING_URL` in lib/site.ts)
├── sanity/                     client, queries (GROQ), image URL builder
├── scripts/                    app.ts (Swup), transitions.ts (curtain, cover-to-hero flip), menu.ts, page.ts (reveals, image blur-up), studio.ts, cycle.ts, motion.ts
└── styles/global.css           design tokens, type scale, fonts
```

Motion hooks any component can use without JavaScript: `data-reveal`, `data-reveal-group`, `data-parallax="0.15"`, `data-hover-video`, `data-loop-video`, `data-slideshow`, `data-splash`, `data-accordion`, `data-cycle`, `data-studio`, `data-flip` / `data-flip-target`, `data-pong`, `data-dog`. They are set up again after every Swup page change. Every Sanity image carries `data-img` and blurs up from its LQIP when it loads.

Transitions: the splash home rises its ticker screen as a curtain over the hero and the next page is revealed underneath; clicking a project tile grows the cover into the project page hero (filled images are cropped in CSS from the same original, with the Sanity hotspot as `object-position`, so the framing never jumps); everything else is a short fade. All in `scripts/transitions.ts` and `scripts/app.ts`. The Studio accordion animates open and shut (`scripts/accordion.ts`).

## Widgets and Easter eggs

Live bits beside the menu button: weather in Joondalup from [Open-Meteo](https://open-meteo.com/) (free, no key, cached for ten minutes) drawn with Microsoft's [Fluent](https://github.com/microsoft/fluentui-system-icons) weather icons (MIT, still), and an analogue clock on Perth time. Code in `web/src/scripts/weather.ts`, icons in `web/src/assets/icons/weather/`.

Three eggs, in `web/src/scripts/eggs/` (the fuller set from 16 to 19 October, achievements, terminal, duck hunt, screensaver and so on, was taken out on 19 October before anything was committed, so it would have to be rebuilt if it is ever wanted back):

| Egg | How to find it |
| --- | --- |
| Comic Sans mode | Type `comic` anywhere on a page, or Ctrl+Alt+C. `undo` restores |
| Pong | The 404 page, in the middle of the message. W and S or the arrow keys, space serves, a finger on touch screens; first to five |
| The dog | A short strip at the bottom of Projects, Studio and Gallery, paper on ink: the door opens, the dog follows your cursor through the living room, and when it reaches the sofa it hops up and sleeps (pixel Zs). Click it for a heart |

Fonts for Comic Sans mode fall back to Comic Neue (OFL) where Comic Sans is not installed. 
