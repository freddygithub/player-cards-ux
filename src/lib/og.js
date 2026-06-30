// Generates the social-preview image (1200x630 PNG) for a team, rendered at
// build time so each becomes a static file. Built with satori (HTML/CSS -> SVG)
// + resvg (SVG -> PNG). Satori supports a subset of CSS (flexbox only, no grid,
// no box-shadow, no radial-gradient), so this template sticks to flex + solid
// fills + linear-gradient, which is why it looks simpler than the live card.
import React from "react";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const h = React.createElement;

// Resolve @fontsource font files via their package.json so deep paths work
// regardless of the package's "exports" map.
function fontFile(pkg, file) {
  const base = dirname(require.resolve(`${pkg}/package.json`));
  return readFileSync(join(base, "files", file));
}

const FONTS = [
  { name: "Inter", weight: 400, style: "normal", data: fontFile("@fontsource/inter", "inter-latin-400-normal.woff") },
  { name: "Inter", weight: 700, style: "normal", data: fontFile("@fontsource/inter", "inter-latin-700-normal.woff") },
  { name: "Anton", weight: 400, style: "normal", data: fontFile("@fontsource/anton", "anton-latin-400-normal.woff") },
];

const THEME = {
  c:  { accent: "#FFC247", glow: "#FF7A4D" },
  r:  { accent: "#38D6C4", glow: "#1F9E92" },
  ia: { accent: "#FF7A4D", glow: "#E14B7A" },
  ib: { accent: "#9B8CFF", glow: "#6C5CE0" },
  ic: { accent: "#5AA9FF", glow: "#2E6FD6" },
};

function initials(name) {
  const skip = new Set(["the", "a", "of", "and", "for", "my"]);
  const words = name.split(/\s+/).filter((w) => !skip.has(w.toLowerCase()));
  return (words.length ? words : name.split(/\s+/)).slice(0, 3).map((w) => (w[0] || "").toUpperCase()).join("");
}

function template(team) {
  const t = team;
  const theme = THEME[t.divisionCode] || THEME.c;
  const winPct = t.wins + t.losses ? Math.round((t.wins / (t.wins + t.losses)) * 100) : 0;
  const setDiff = t.setWins - t.setLosses;

  const stat = (value, label, accent) =>
    h("div", { style: { display: "flex", flexDirection: "column" } }, [
      h("div", { style: { fontFamily: "Anton", fontSize: 46, color: accent ? theme.accent : "#FFFFFF", lineHeight: 1 } }, String(value)),
      h("div", { style: { fontSize: 16, letterSpacing: 2, color: "#8FA4CC", marginTop: 6, textTransform: "uppercase" } }, label),
    ]);

  return h("div", {
    style: {
      width: "1200px", height: "630px", display: "flex", padding: "64px",
      backgroundColor: "#0A1730",
      backgroundImage: `linear-gradient(135deg, #0C1E40 0%, #0A1730 55%, #070F22 100%)`,
      color: "#EAF1FF", fontFamily: "Inter", position: "relative",
    },
  }, [
    // accent edge
    h("div", { style: { position: "absolute", left: 0, top: 0, bottom: 0, width: 14, backgroundColor: theme.accent } }),
    // left column
    h("div", { style: { display: "flex", flexDirection: "column", flex: 1, paddingLeft: 24 } }, [
      h("div", { style: { fontSize: 20, letterSpacing: 4, color: "#9DB2D8", textTransform: "uppercase" } },
        `Tampa Bay Club Sport${t.season ? " · " + t.season : ""}`),
      h("div", { style: { fontFamily: "Anton", fontSize: 84, lineHeight: 1.02, marginTop: 8, maxWidth: 760 } }, t.name),
      h("div", { style: { fontSize: 22, letterSpacing: 3, color: theme.accent, textTransform: "uppercase", marginTop: 4 } }, t.division || ""),
      // win% + stats
      h("div", { style: { display: "flex", alignItems: "flex-end", gap: 48, marginTop: "auto" } }, [
        h("div", { style: { display: "flex", flexDirection: "column" } }, [
          h("div", { style: { fontFamily: "Anton", fontSize: 150, lineHeight: 0.85, color: theme.accent } }, `${winPct}%`),
          h("div", { style: { fontSize: 18, letterSpacing: 4, color: "#9DB2D8", textTransform: "uppercase", marginTop: 6 } }, "Win Rate"),
        ]),
        h("div", { style: { display: "flex", gap: 40, paddingBottom: 12 } }, [
          stat(`${t.wins}-${t.losses}`, "Record"),
          stat(`${setDiff >= 0 ? "+" : ""}${setDiff}`, "Set Diff", true),
          stat(t.streak || "-", "Streak", true),
        ]),
      ]),
    ]),
    // right emblem
    h("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", width: 300 } }, [
      h("div", {
        style: {
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 260, height: 260, borderRadius: 260,
          border: `10px solid ${theme.accent}`, backgroundColor: "#0E1D3C",
          fontFamily: "Anton", fontSize: 96, color: "#FFFFFF",
        },
      }, initials(t.name)),
    ]),
  ]);
}

export async function ogPng(team) {
  const svg = await satori(template(team), { width: 1200, height: 630, fonts: FONTS });
  return new Resvg(svg).render().asPng();
}
