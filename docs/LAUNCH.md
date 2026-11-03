# Launch checklist

The site goes live on identityperth.com in place of the WordPress site that is there now. Target: Tuesday 3 November 2026. Items are in order; each says who does it.

## Before the day

1. **Content.** Projects (15 to 25, Nick), the real gallery set (Seth), the Thinking page stays hidden (stage two). Any new project goes in through the CMS or from its export folder as before. (Belinda, Seth, Ross)
2. **Parked content.** Cleared on 28 Oct: the old site's project and client drafts, the grey gallery placeholders and the files only they used are gone. The gallery now holds the five real tiles until Seth's set arrives.
3. **Analytics.** Set up on 2 Nov (README, Analytics): GA4 G-4YFE37WMQN through Zaraz, Clarity project z77zmahlca, `PUBLIC_ZARAZ=true` and `PUBLIC_CLARITY_ID` in `web/.env`. Still to do: register `area` and `label` as event-scoped custom dimensions in GA4 (Admin, Custom definitions), and put the two variables in the Worker's Builds variables when Builds is set up. (Ross)
4. **Search Console.** Neither connected Google account has identityperth.com in Search Console. Add it as a domain property (DNS TXT record in the Cloudflare zone) so the sitemap can be submitted on launch day. (Ross)
5. **Worker secret.** `cd web && npx wrangler login && npx wrangler secret bulk .dev.vars` puts `SANITY_READ_TOKEN` on the Worker. Confirm the token in `.dev.vars` is the Viewer robot token "Site preview" from sanity.io/manage, not a personal CLI token. The preview cookie is signed with it. (Ross)
6. **Builds.** Done 3 Nov: the Worker builds from `main` and from every Studio publish (README, Deploying). Commit and push anything deployed by hand, or the next build reverts it.
7. **Sanity CORS.** Already allows `https://identityperth.com`, `https://www.identityperth.com` and the workers.dev address (checked 28 Oct). Nothing to do.
8. **Stream.** Optional: in the Stream dashboard, restrict each video's allowed origins to identityperth.com and the workers.dev address so other sites cannot embed them. (Ross)
9. **Rehearse on staging.** `npm run build:staging && npm run deploy:staging` in `web/`, and test on real phones: home video both ways round, a project page, the Studio accordion, the gallery panel, the menu, the terms page. (Ross, then Nick and Belinda for sign-off)

## Cut-over

10. **Domain.** In the Identity Cloudflare account, on the Worker `identityperth`: Settings, Domains & Routes, add custom domains `identityperth.com` and `www.identityperth.com`. Cloudflare writes the DNS records; delete the old A/AAAA records that point at the WordPress host. Do not touch the MX, SPF, DKIM or DMARC records: email must keep working. Add a redirect rule (Rules, Redirect Rules) from `www.identityperth.com/*` to `https://identityperth.com/$1`, 301. (Ross)
11. **Deploy a production build** (`SITE_URL` unset) once the domain answers, then `node scripts/zaraz.mjs launch` in `web/` to switch Zaraz to the new site. (Ross or Workers Builds, then Claude)
12. **Check, in this order.**
    - `curl -I https://identityperth.com/` is 200 with the security headers and no `X-Robots-Tag`.
    - `https://identityperth.com/robots.txt` allows all and names the sitemap; `https://identityperth.com/sitemap-index.xml` lists the pages.
    - `https://identityperth.com/work/` redirects to `/projects/`, `/contact-us/` to `/studio/#contact`.
    - A page shared in Slack or iMessage shows its card (`/og/...png`).
    - The Studio at `https://identityperth.com/backend/` logs in, the Preview tab shows drafts, and publishing a change rebuilds the site within a few minutes.
    - A phone on mobile data plays the home video and a project video.
    - `https://identityperth.com/cdn-cgi/zaraz/i.js` is 200. GA4's Realtime report shows the visit's page views and a `select_content` after clicking a project card, and Clarity lists the session within a few minutes.
13. **Search Console.** Done 3 Nov: the domain property exists and the sitemap is submitted. Request indexing of the home, Projects and Studio pages once it has processed. (Ross)
14. **Close the staging copy.** Done 3 Nov: the live Worker's workers.dev address is off, and staging is its own password-protected Worker, identityperth-staging (README, Deploying).

## After

15. **Keep the WordPress host for two weeks** in case of a rollback (point the DNS back), then cancel it. Export anything wanted from it first. (Ross)
16. **Revoke the old credentials** in the archived `tilt-api` (noted during the rebuild). (Ross)
17. **A week on:** Search Console coverage and the redirects report, and GA4's `page_not_found` events by page path (old WordPress addresses people still follow); redirect anything 404ing that had traffic. **A month on:** Core Web Vitals in Search Console (the Lighthouse scores at launch were 97 to 100 on every page, mobile and desktop).
18. **Stage two:** the Thinking page (blog archive and single template), gallery video tiles if the motion pieces arrive.
