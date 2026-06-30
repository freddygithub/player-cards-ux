// Reads the DB and produces the exact `team` shape TeamCard.jsx expects.
// This is the JS port of the Python cards.py stats logic: win rate, set diff,
// streak, recent form, home/away splits -- computed in one pair of queries.
import { sql } from "./db.js";

const SKIP = new Set(["the", "a", "of", "and", "for", "my"]);

// Division isn't a column -- the scraper bakes it into the team name as a
// trailing "(code)", e.g. "Bump Set Spikers (ia)".
const DIVISION_LABELS = { c: "Competitive", r: "Recreational", ia: "Intermediate A", ib: "Intermediate B", ic: "Intermediate C" };

function parseDivision(rawName) {
  const m = rawName.match(/\s*\(([a-z]{1,3})\)\s*$/i);
  if (!m) return { name: rawName, code: "c" };
  return { name: rawName.slice(0, m.index).trim(), code: m[1].toLowerCase() };
}

export function slugify(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function initials(name) {
  const words = name.split(/\s+/).filter((w) => !SKIP.has(w.toLowerCase()));
  return (words.length ? words : name.split(/\s+/))
    .slice(0, 3)
    .map((w) => (w[0] ? w[0].toUpperCase() : ""))
    .join("");
}

function leagueFilter() {
  // Optional: limit which leagues get built. Comma-separated ids in env.
  if (!process.env.LEAGUE_IDS) return null;
  return process.env.LEAGUE_IDS.split(",").map((s) => parseInt(s.trim(), 10));
}

function initCard(t) {
  return {
    raw: t,
    games: 0, wins: 0, losses: 0,
    setWins: 0, setLosses: 0,
    homeW: 0, homeL: 0, awayW: 0, awayL: 0,
    results: [],          // chronological "W"/"L"
    locCounts: {},
  };
}

function record(c, isHome, mySets, oppSets, won, locName) {
  c.games++;
  c.setWins += mySets;
  c.setLosses += oppSets;
  if (won) { c.wins++; c.results.push("W"); isHome ? c.homeW++ : c.awayW++; }
  else { c.losses++; c.results.push("L"); isHome ? c.homeL++ : c.awayL++; }
  if (locName) c.locCounts[locName] = (c.locCounts[locName] || 0) + 1;
}

function finalize(c) {
  const t = c.raw;
  const winRate = c.games ? c.wins / c.games : 0;
  // current streak from the tail of results
  let streak = "";
  if (c.results.length) {
    const last = c.results[c.results.length - 1];
    let n = 0;
    for (let i = c.results.length - 1; i >= 0 && c.results[i] === last; i--) n++;
    streak = `${last}${n}`;
  }
  // most-played location (falls back to undefined)
  const location = Object.entries(c.locCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  const { name, code } = parseDivision(t.name);

  return {
    name,
    division: DIVISION_LABELS[code] || code,
    divisionCode: code,
    season: t.season || "",
    leagueDay: t.day_of_week || "",
    location,
    leagueId: Number(t.league_id),
    teamId: Number(t.id),
    wins: c.wins,
    losses: c.losses,
    setWins: c.setWins,
    setLosses: c.setLosses,
    setDiff: c.setWins - c.setLosses,
    winRate,
    streak,
    recentForm: c.results.slice(-5),
    homeRecord: `${c.homeW}-${c.homeL}`,
    awayRecord: `${c.awayW}-${c.awayL}`,
    imageUrl: t.image_url || null,   // ready for when you add a team-photo column
  };
}

export async function getAllTeamCards() {
  const ids = leagueFilter();

  const teams = ids
    ? await sql`SELECT t.*, l.season, l.day_of_week
                FROM teams t JOIN leagues l ON l.id = t.league_id
                WHERE t.league_id = ANY(${ids})`
    : await sql`SELECT t.*, l.season, l.day_of_week
                FROM teams t JOIN leagues l ON l.id = t.league_id`;

  const games = ids
    ? await sql`SELECT * FROM games
                WHERE home_score IS NOT NULL AND away_score IS NOT NULL AND league_id = ANY(${ids})
                ORDER BY game_date ASC, game_time ASC`
    : await sql`SELECT * FROM games
                WHERE home_score IS NOT NULL AND away_score IS NOT NULL
                ORDER BY game_date ASC, game_time ASC`;

  const byId = new Map();
  for (const t of teams) byId.set(Number(t.id), initCard(t));

  for (const g of games) {
    const home = byId.get(Number(g.home_team_id));
    const away = byId.get(Number(g.away_team_id));
    const homeWon = Number(g.home_score) > Number(g.away_score);
    if (home) record(home, true, g.home_score, g.away_score, homeWon, g.location_name);
    if (away) record(away, false, g.away_score, g.home_score, !homeWon, g.location_name);
  }

  const cards = [...byId.values()].map(finalize);

  // Assign unique, human-readable slugs. On collision (e.g. "Just the Tip"
  // exists in two divisions) fall back to name+division, then name+id.
  const seen = new Set();
  for (const c of cards) {
    const base = slugify(c.name) || `team-${c.teamId}`;
    let slug = base;
    if (seen.has(slug)) slug = `${base}-${c.divisionCode}`;
    if (seen.has(slug)) slug = `${base}-${c.teamId}`;
    seen.add(slug);
    c.slug = slug;
  }
  return cards;
}

// Grouped + sorted for the standings index: { leagueId, division, divisionCode, teams[] }
export async function getStandings() {
  const cards = await getAllTeamCards();
  const groups = new Map();
  for (const c of cards) {
    const key = `${c.leagueId}:${c.divisionCode}`;
    if (!groups.has(key)) {
      groups.set(key, { leagueId: c.leagueId, division: c.division, divisionCode: c.divisionCode, teams: [] });
    }
    groups.get(key).teams.push(c);
  }
  for (const g of groups.values()) {
    g.teams.sort((a, b) => b.wins - a.wins || b.winRate - a.winRate || b.setDiff - a.setDiff);
  }
  const order = { c: 0, r: 1, ia: 2, ib: 3, ic: 4 };
  return [...groups.values()].sort(
    (a, b) => (order[a.divisionCode] ?? 9) - (order[b.divisionCode] ?? 9)
  );
}
