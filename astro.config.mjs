// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";

// Static site (SSG): pages are pre-rendered at build time from Neon, so the
// deployed output is flat files -- fast and cheap to host on Cloudflare Pages
// or Netlify. Re-run the build after each nightly scrape to refresh the cards.
export default defineConfig({
  site: "https://your-domain.pages.dev", // update when you deploy
  integrations: [react()],
});
