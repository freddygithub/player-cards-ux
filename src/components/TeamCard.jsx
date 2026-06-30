import React from "react";

/* =========================================================================
   TeamCard — a shareable trading card for a rec-league volleyball team.
   Drop-in for Astro: <TeamCard team={team} /> with the shape below.
   No required props (sample team is the default) so it renders standalone.
   ========================================================================= */

const SAMPLE_TEAM = {
  name: "Here for the Beer",
  division: "Competitive",
  divisionCode: "c",
  season: "Summer 2026",
  leagueDay: "Monday",
  location: "The Rec Dec",
  leagueId: 100573,
  teamId: 992191,
  wins: 5,
  losses: 0,
  setWins: 10,
  setLosses: 1,
  streak: "W5",
  recentForm: ["W", "W", "W", "W", "W"], // oldest -> newest
  homeRecord: "3-0",
  awayRecord: "2-0",
  imageUrl: null, // optional team photo; when set it becomes the card background
};

// Division-driven accent so each tier of card feels distinct.
const DIVISION_THEME = {
  c:  { accent: "#FFC247", glow: "#FF7A4D", label: "Competitive" },     // gold/sun
  r:  { accent: "#38D6C4", glow: "#1F9E92", label: "Recreational" },    // gulf teal
  ia: { accent: "#FF7A4D", glow: "#E14B7A", label: "Intermediate A" },  // coral
  ib: { accent: "#9B8CFF", glow: "#6C5CE0", label: "Intermediate B" },  // dusk violet
  ic: { accent: "#5AA9FF", glow: "#2E6FD6", label: "Intermediate C" },  // sky
};

function initials(name) {
  const skip = new Set(["the", "a", "of", "and", "for", "my"]);
  const words = name.split(/\s+/).filter((w) => !skip.has(w.toLowerCase()));
  return (words.length ? words : name.split(/\s+/))
    .slice(0, 3)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export default function TeamCard({ team = SAMPLE_TEAM }) {
  const t = team;
  const games = t.wins + t.losses;
  const winRate = games ? t.wins / games : 0;
  const winPct = Math.round(winRate * 100);
  const setDiff = t.setWins - t.setLosses;
  const theme = DIVISION_THEME[t.divisionCode] || DIVISION_THEME.c;

  // win-rate ring geometry
  const R = 58;
  const C = 2 * Math.PI * R;
  const dash = C * winRate;

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Anton&family=Archivo:wght@500;700;800;900&family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@500&display=swap');
    .tc-wrap{ display:flex; justify-content:center; align-items:center; padding:32px 16px;
      font-family:'Inter',system-ui,sans-serif; }
    .tc{ position:relative; width:380px; aspect-ratio:5/7; border-radius:22px; overflow:hidden;
      color:#EAF1FF; isolation:isolate;
      background:
        radial-gradient(120% 70% at 50% 118%, ${theme.glow}55 0%, transparent 55%),
        radial-gradient(90% 60% at 50% -10%, #1C3E73 0%, transparent 60%),
        linear-gradient(180deg,#0C1E40 0%,#0A1730 55%,#070F22 100%);
      box-shadow: 0 24px 60px -20px #000A, 0 0 0 1px #ffffff14, inset 0 0 0 1px #ffffff0a;
      animation: tc-in .6s cubic-bezier(.2,.7,.2,1) both; }
    @keyframes tc-in{ from{opacity:0; transform:translateY(10px) scale(.985)} to{opacity:1;transform:none} }
    /* sun arc + sheen */
    .tc::before{ content:""; position:absolute; left:-10%; right:-10%; bottom:-42%; height:70%;
      background:radial-gradient(closest-side, ${theme.glow}40, transparent 70%); z-index:0; }
    .tc::after{ content:""; position:absolute; inset:0; z-index:5; pointer-events:none;
      background:linear-gradient(125deg, #ffffff22 0%, #ffffff00 22% 60%, #ffffff10 100%); }
    .tc-net{ position:absolute; inset:0; z-index:0; opacity:.06;
      background-image:linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px);
      background-size:22px 22px; mask-image:linear-gradient(180deg,transparent,#000 30% 70%,transparent); }
    /* optional team photo + sunset-tinted scrim (keeps the vibe, keeps text legible) */
    .tc-photo{ position:absolute; inset:0; z-index:1; background-size:cover; background-position:center top;
      filter:saturate(1.05) contrast(1.02); }
    .tc-scrim{ position:absolute; inset:0; z-index:2; pointer-events:none;
      background:
        radial-gradient(120% 75% at 50% 122%, ${theme.glow}66 0%, transparent 58%),
        linear-gradient(180deg, #0A1730CC 0%, #0A173033 26%, #0A1730B0 70%, #070F22F2 100%); }
    .tc-inner{ position:relative; z-index:6; height:100%; display:flex; flex-direction:column;
      padding:20px 20px 16px; }
    .tc-eyebrow{ font-size:10px; letter-spacing:.22em; text-transform:uppercase; color:#9DB2D8; font-weight:700; }
    .tc-head{ display:flex; justify-content:space-between; align-items:flex-start; gap:10px; }
    .tc-badge{ text-align:right; line-height:1.15; }
    .tc-badge b{ font-family:'Archivo'; font-weight:900; font-size:15px; letter-spacing:.04em; color:#fff;
      display:block; }
    .tc-name{ font-family:'Archivo'; font-weight:900; font-size:30px; line-height:.96; letter-spacing:-.01em;
      margin:6px 0 0; text-shadow:0 2px 16px #0006; }
    .tc-hero{ display:flex; align-items:center; gap:14px; margin-top:6px; }
    .tc-pct{ font-family:'Anton'; font-size:74px; line-height:.8; letter-spacing:.01em;
      color:${theme.accent}; text-shadow:0 4px 24px ${theme.glow}66; }
    .tc-pct small{ font-size:30px; vertical-align:top; margin-left:2px; }
    .tc-pctlab{ font-size:10px; letter-spacing:.24em; text-transform:uppercase; color:#9DB2D8;
      font-weight:700; margin-top:2px; }
    .tc-crest{ margin-left:auto; position:relative; width:132px; height:132px; flex:none; }
    .tc-mono{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
      font-family:'Archivo'; font-weight:900; font-size:34px; color:#fff; letter-spacing:.02em;
      text-shadow:0 2px 10px #0008; }
    .tc-stats{ margin-top:auto; }
    .tc-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:10px 6px; margin-top:8px; }
    .tc-stat .v{ font-family:'Archivo'; font-weight:800; font-size:21px; color:#fff; line-height:1; }
    .tc-stat .v.pos{ color:${theme.accent}; }
    .tc-stat .k{ font-size:9px; letter-spacing:.16em; text-transform:uppercase; color:#8FA4CC;
      font-weight:700; margin-top:4px; }
    .tc-form{ display:flex; gap:6px; margin-top:3px; }
    .tc-pip{ width:13px; height:13px; border-radius:50%; box-shadow:inset 0 0 0 1.5px #ffffff30; }
    .tc-rule{ height:1px; background:linear-gradient(90deg,transparent,#ffffff26,transparent); margin:14px 0 12px; }
    .tc-foot{ display:flex; justify-content:space-between; align-items:flex-end; gap:8px; }
    .tc-div{ font-family:'Archivo'; font-weight:800; font-size:13px; letter-spacing:.14em;
      text-transform:uppercase; color:${theme.accent}; }
    .tc-meta{ text-align:right; font-size:10.5px; color:#9DB2D8; line-height:1.5; }
    .tc-code{ font-family:'JetBrains Mono',monospace; font-size:9.5px; letter-spacing:.08em;
      color:#67799E; margin-top:10px; }
    @media (prefers-reduced-motion: reduce){ .tc{ animation:none } }
  `;

  const code = `TBCS-${t.leagueId}-${t.teamId}`;

  return (
    <div className="tc-wrap">
      <style>{css}</style>
      <div className="tc">
        <div className="tc-net" />
        {t.imageUrl && <div className="tc-photo" style={{ backgroundImage: `url(${t.imageUrl})` }} />}
        {t.imageUrl && <div className="tc-scrim" />}
        <div className="tc-inner">
          {/* header */}
          <div className="tc-head">
            <div>
              <div className="tc-eyebrow">{t.season}</div>
              <h1 className="tc-name">{t.name}</h1>
            </div>
            <div className="tc-badge">
              <b>TBCS</b>
              <span className="tc-eyebrow">Coed VB</span>
            </div>
          </div>

          {/* hero: win% + crest */}
          <div className="tc-hero">
            <div>
              <div className="tc-pct">{winPct}<small>%</small></div>
              <div className="tc-pctlab">Win Rate</div>
            </div>

            <div className="tc-crest">
              <svg viewBox="0 0 132 132" width="132" height="132">
                <defs>
                  <radialGradient id="ball" cx="38%" cy="32%" r="75%">
                    <stop offset="0%" stopColor="#26406e" />
                    <stop offset="100%" stopColor="#0e1d3c" />
                  </radialGradient>
                </defs>
                {/* track + win-rate ring */}
                <circle cx="66" cy="66" r={R} fill="none" stroke="#ffffff1f" strokeWidth="6" />
                <circle cx="66" cy="66" r={R} fill="none" stroke={theme.accent} strokeWidth="6"
                  strokeLinecap="round" strokeDasharray={`${dash} ${C}`}
                  transform="rotate(-90 66 66)" />
                {/* volleyball */}
                <circle cx="66" cy="66" r="46" fill="url(#ball)" stroke="#ffffff22" />
                <g stroke="#ffffff30" strokeWidth="2" fill="none">
                  <path d="M30 56 Q66 44 102 56" />
                  <path d="M34 86 Q66 74 98 86" />
                  <path d="M66 20 Q58 66 66 112" />
                </g>
              </svg>
              <div className="tc-mono">{initials(t.name)}</div>
            </div>
          </div>

          {/* stats */}
          <div className="tc-stats">
            <div className="tc-eyebrow">Season Stats</div>
            <div className="tc-grid">
              <div className="tc-stat"><div className="v">{t.wins}-{t.losses}</div><div className="k">Record</div></div>
              <div className="tc-stat"><div className="v">{t.setWins}-{t.setLosses}</div><div className="k">Sets</div></div>
              <div className="tc-stat"><div className="v pos">{setDiff >= 0 ? "+" : ""}{setDiff}</div><div className="k">Set Diff</div></div>
              <div className="tc-stat"><div className="v pos">{t.streak}</div><div className="k">Streak</div></div>
              <div className="tc-stat"><div className="v">{t.homeRecord}</div><div className="k">Home</div></div>
              <div className="tc-stat">
                <div className="tc-form">
                  {t.recentForm.slice(-5).map((r, i) => (
                    <span key={i} className="tc-pip"
                      style={{ background: r === "W" ? theme.accent : "transparent",
                               boxShadow: r === "W" ? `0 0 8px ${theme.glow}` : "inset 0 0 0 1.5px #ffffff30" }} />
                  ))}
                </div>
                <div className="k">Last 5</div>
              </div>
            </div>
          </div>

          <div className="tc-rule" />

          {/* footer */}
          <div className="tc-foot">
            <div className="tc-div">{t.division}</div>
            <div className="tc-meta">{t.leagueDay} · {t.location}<br />{games} games played</div>
          </div>
          <div className="tc-code">{code}</div>
        </div>
      </div>
    </div>
  );
}
