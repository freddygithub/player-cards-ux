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

// "2026-07-06" -> "Mon, Jul 6". Built from Y/M/D parts (not Date.parse) so it
// never shifts a day from timezone interpretation of a bare date string.
function formatGameDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = String(dateStr).split("-").map(Number);
  if (!y || !m || !d) return String(dateStr);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

// "19:30:00" -> "7:30 PM". Falls back to the raw value if it isn't HH:MM-ish.
function formatGameTime(timeStr) {
  if (!timeStr) return "";
  const m = String(timeStr).match(/^(\d{1,2}):(\d{2})/);
  if (!m) return String(timeStr);
  let h = parseInt(m[1], 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m[2]} ${ampm}`;
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

// "Today" in the league's local timezone, as YYYY-MM-DD text -- matches the
// format game_date is stored in, so it can be compared lexicographically.
function todayStr() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
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
    nextGame: null,
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
    nextGame: c.nextGame,
  };
}

// Groups by leagueId+division (same tiers as getStandings) and stamps each
// team with its rank + division size, so single-team lookups (getAllTeamCards)
// don't need a separate getStandings() call to know standing.
function assignRanks(cards) {
  const groups = new Map();
  for (const c of cards) {
    const key = `${c.leagueId}:${c.divisionCode}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(c);
  }
  for (const teams of groups.values()) {
    teams.sort((a, b) => b.wins - a.wins || b.winRate - a.winRate || b.setDiff - a.setDiff);
    teams.forEach((t, i) => { t.rank = i + 1; t.divisionSize = teams.length; });
  }
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

  // "Next game" must be an actual future game -- a past game whose result
  // just hasn't been entered yet (score still NULL) doesn't count.
  const today = todayStr();
  const upcoming = ids
    ? await sql`SELECT * FROM games
                WHERE (home_score IS NULL OR away_score IS NULL) AND game_date >= ${today} AND league_id = ANY(${ids})
                ORDER BY game_date ASC, game_time ASC`
    : await sql`SELECT * FROM games
                WHERE (home_score IS NULL OR away_score IS NULL) AND game_date >= ${today}
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

  // Nearest unplayed game per team (upcoming is already date/time ascending,
  // so the first match per side is its next game).
  const opponentName = (id) => {
    const c = byId.get(Number(id));
    return c ? parseDivision(c.raw.name).name : "TBD";
  };
  for (const g of upcoming) {
    const home = byId.get(Number(g.home_team_id));
    const away = byId.get(Number(g.away_team_id));
    if (home && !home.nextGame) {
      home.nextGame = { opponent: opponentName(g.away_team_id), isHome: true, date: formatGameDate(g.game_date), time: formatGameTime(g.game_time), location: g.location_name || null };
    }
    if (away && !away.nextGame) {
      away.nextGame = { opponent: opponentName(g.home_team_id), isHome: false, date: formatGameDate(g.game_date), time: formatGameTime(g.game_time), location: g.location_name || null };
    }
  }

  const cards = [...byId.values()].map(finalize);
  assignRanks(cards);

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
