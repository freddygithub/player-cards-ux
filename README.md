# TBCS Cards — site

Astro + React front end that turns the scraped Neon data into shareable team
cards. Static site generation: every team page is pre-rendered at build time
from the database, so the deployed output is flat files.

```
src/
  components/TeamCard.jsx   the card (themed; supports optional team photo)
  lib/db.js                 Neon connection (build-time)
  lib/stats.js              DB -> team-card shape (win rate, streak, form, ...)
  layouts/Base.astro        page shell + global dusk theme
  pages/index.astro         standings index, grouped by division, links to cards
  pages/team/[id].astro     one static card page per team (getStaticPaths)
```

## Setup

Requires Node 18+ and your Neon database already populated (the backend repo).

```bash
npm install
cp .env.example .env        # then paste your Neon pooled connection string
npm run dev                 # http://localhost:4321
```

If `npm install` complains about the React integration version, let Astro pick
compatible versions for you:

```bash
npm create astro@latest .   # only if starting fresh; choose "empty"
npx astro add react         # installs @astrojs/react + react + react-dom, edits config
npm i @neondatabase/serverless
```

Then drop these `src/` files in over the generated ones.

## How it works

- `getAllTeamCards()` runs two queries (teams + completed games) and computes
  each team's record, win rate, set differential, streak, recent form, and
  home/away splits in memory — the JS twin of the backend's `cards.py`.
- `pages/team/[id].astro` calls it in `getStaticPaths`, emitting one page per
  team. The card has no interactivity, so there's **no `client:` directive** —
  Astro renders the React to HTML at build and ships zero JS.
- `pages/index.astro` groups teams by division for the standings list.

## Shareability

This is what makes a pasted link turn into a card preview in iMessage, Slack,
Discord, or X:

- **Clean slugs.** Pages live at `/team/here-for-the-beer`, not `/team/992191`.
  `lib/stats.js` assigns a unique slug per team and de-collides names that
  repeat across divisions (e.g. "Just the Tip" -> `just-the-tip` and
  `just-the-tip-ic`).
- **Social meta tags.** `Base.astro` emits Open Graph + Twitter tags. Each team
  page sets an absolute title, description, canonical URL, and preview image.
- **Per-team preview images.** `pages/team/[slug].png.ts` renders a 1200x630 PNG
  for every team at build time (via `lib/og.js`, using satori + resvg). The image
  is a landscape take on the card — division accent, win%, record, monogram — so
  the unfurl looks like the card itself.

**Important:** social images require absolute URLs, so set a real `site` in
`astro.config.mjs` before deploying. Locally the URLs will point at the
placeholder domain; that's fine for `npm run dev` but unfurls only work once
`site` is your real domain and the site is publicly reachable. Test with the
[opengraph.xyz](https://www.opengraph.xyz) debugger after deploy.

Fonts for the preview image come from `@fontsource/inter` and `@fontsource/anton`
(installed via npm — no manual font downloads). `@resvg/resvg-js` is a native
module; it runs at build time only, so the generated PNGs are plain static files.



The site is a snapshot of the DB at build time. To pick up new results, just
rebuild (`npm run build`). In production, trigger this build right after the
nightly scrape so cards refresh once a day.

## Deploy (later)

Cloudflare Pages or Netlify (both allow commercial use on the free tier):
connect the repo, set the build command to `npm run build`, output dir `dist`,
and add `DATABASE_URL` as an environment variable. Chain the rebuild to the
scraper so each night's scrape is followed by a fresh deploy.

## Team photos (later)

The card already supports `team.imageUrl`. When you're ready, add an
`image_url` column to the `teams` table (or drop files in `public/team/{id}.jpg`
and map them in `lib/stats.js`); the card overlays a sunset scrim so any photo
stays legible and on-brand.
