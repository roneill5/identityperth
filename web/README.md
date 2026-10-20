# web/

The Astro site. Everything worth knowing is in the repository README one level up: commands, how content flows from the Studio, the draft preview, deploying, and where things live in `src/`.

Quick reference:

```sh
npm run dev       # http://localhost:4321 (needs SANITY_READ_TOKEN in .env and .dev.vars for the preview routes)
npm run build     # dist/client (static files) and dist/server (the Worker for /backend and /preview)
npm run deploy    # wrangler deploy with dist/server/wrangler.json
npm run types     # regenerates worker-configuration.d.ts from wrangler.jsonc and .dev.vars (also runs on install)
```

`sanity.types.ts` is generated from the Studio's schema and the GROQ queries: `npm run typegen` from the repository root.
