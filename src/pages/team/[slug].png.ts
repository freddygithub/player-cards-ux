import { getAllTeamCards } from "../../lib/stats.js";
import { ogPng } from "../../lib/og.js";

// Emits /team/{slug}.png as a static file at build time, one per team.
export async function getStaticPaths() {
  const cards = await getAllTeamCards();
  return cards.map((team) => ({ params: { slug: team.slug }, props: { team } }));
}

export const GET = async ({ props }) => {
  const png = await ogPng(props.team);
  return new Response(png, {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" },
  });
};
