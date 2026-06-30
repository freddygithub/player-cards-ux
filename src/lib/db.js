// Build-time Neon connection. Astro only copies .env into process.env during
// `astro build`, not `astro dev` -- so we load it ourselves here to keep dev
// and build consistent. The Neon serverless driver works over fetch, so it's
// also ready if you later deploy to an edge runtime (Cloudflare Pages).
import { neon } from "@neondatabase/serverless";
import "dotenv/config";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env and paste your Neon " +
    "pooled connection string (the host with -pooler, ending in ?sslmode=require)."
  );
}

export const sql = neon(url);
