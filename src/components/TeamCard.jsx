import React, { useState } from "react";

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
  rank: 1,
  divisionSize: 8,
  slug: "here-for-the-beer",
  nextGame: {
    opponent: "Net Gains",
    isHome: true,
    date: "Mon, Jul 7",
    time: "7:30 PM",
    location: "The Rec Dec",
  },
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
  const [flipped, setFlipped] = useState(false);
  const games = t.wins + t.losses;
  const winRate = games ? t.wins / games : 0;
  const winPct = Math.round(winRate * 100);
  const setDiff = t.setWins - t.setLosses;
  const theme = DIVISION_THEME[t.divisionCode] || DIVISION_THEME.c;

  function toggleFlip() {
    setFlipped((f) => !f);
  }

  function onFlipKeyDown(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleFlip();
    }
  }

  async function handleShare(e) {
    e.stopPropagation();
    if (!t.slug) return;
    const shareUrl = new URL(`/team/${t.slug}.png`, window.location.origin).toString();
    try {
      if (navigator.canShare) {
        const resp = await fetch(shareUrl);
        const blob = await resp.blob();
        const file = new File([blob], `${t.slug}.png`, { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: t.name, text: `${t.name} — TBCS team card` });
          return;
        }
      }
      if (navigator.share) {
        await navigator.share({ title: t.name, url: shareUrl });
        return;
      }
    } catch (err) {
      if (err?.name === "AbortError") return;
    }
    const a = document.createElement("a");
    a.href = shareUrl;
    a.download = `${t.slug}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // win-rate ring geometry
  const R = 58;
  const C = 2 * Math.PI * R;
  const dash = C * winRate;

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Anton&family=Archivo:wght@500;700;800;900&family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@500&display=swap');
    .tc-wrap{ display:flex; justify-content:center; align-items:center; padding:24px 12px;
      width:100%; font-family:'Inter',system-ui,sans-serif; }
    .tc-flip{ position:relative; width:min(380px, calc(100vw - 64px)); aspect-ratio:5/7;
      perspective:1600px; cursor:pointer;
      animation: tc-in .6s cubic-bezier(.2,.7,.2,1) both; }
    .tc-flip-inner{ position:relative; width:100%; height:100%; transform-style:preserve-3d;
      transition: transform .6s cubic-bezier(.22,.7,.2,1); }
    .tc-flip.is-flipped .tc-flip-inner{ transform:rotateY(180deg); }
    @keyframes tc-in{ from{opacity:0; transform:translateY(10px) scale(.985)} to{opacity:1;transform:none} }
    .tc{ position:absolute; inset:0; border-radius:22px; overflow:hidden;
      color:#EAF1FF; isolation:isolate; backface-visibility:hidden;
      background:
        radial-gradient(120% 70% at 50% 118%, ${theme.glow}55 0%, transparent 55%),
        radial-gradient(90% 60% at 50% -10%, #1C3E73 0%, transparent 60%),
        linear-gradient(180deg,#0C1E40 0%,#0A1730 55%,#070F22 100%);
      box-shadow: 0 24px 60px -20px #000A, 0 0 0 1px #ffffff14, inset 0 0 0 1px #ffffff0a; }
    .tc.face-back{ transform:rotateY(180deg); }
    .tc-share{ position:absolute; bottom:14px; right:14px; z-index:20;
      width:34px; height:34px; border-radius:50%; border:none; cursor:pointer;
      display:flex; align-items:center; justify-content:center;
      background:#0A1730b3; box-shadow:inset 0 0 0 1px #ffffff2a; color:#EAF1FF;
      opacity:1; transition: background .15s ease, transform .15s ease, opacity .2s ease; }
    .tc-share:hover{ background:#ffffff1f; transform:scale(1.06); }
    .tc-share:active{ transform:scale(.94); }
    .tc-share svg{ width:16px; height:16px; }
    .tc-flip.is-flipped .tc-share{ opacity:0; pointer-events:none; }
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
      padding:clamp(14px,5vw,20px) clamp(14px,5vw,20px) clamp(12px,4vw,16px); }
    .tc-eyebrow{ font-size:10px; letter-spacing:.22em; text-transform:uppercase; color:#9DB2D8; font-weight:700; }
    .tc-head{ display:flex; justify-content:space-between; align-items:flex-start; gap:10px; }
    .tc-badge{ text-align:right; line-height:1.15; }
    .tc-badge b{ font-family:'Archivo'; font-weight:900; font-size:15px; letter-spacing:.04em; color:#fff;
      display:block; }
    .tc-name{ font-family:'Archivo'; font-weight:900; font-size:clamp(20px,7vw,30px); line-height:.96; letter-spacing:-.01em;
      margin:6px 0 0; text-shadow:0 2px 16px #0006; }
    .tc-hero{ display:flex; align-items:center; gap:14px; margin-top:6px; }
    .tc-pct{ font-family:'Anton'; font-size:clamp(42px,15vw,74px); line-height:.8; letter-spacing:.01em;
      color:${theme.accent}; text-shadow:0 4px 24px ${theme.glow}66; }
    .tc-pct small{ font-size:.4em; vertical-align:top; margin-left:2px; }
    .tc-pctlab{ font-size:10px; letter-spacing:.24em; text-transform:uppercase; color:#9DB2D8;
      font-weight:700; margin-top:2px; }
    .tc-crest{ margin-left:auto; position:relative; width:clamp(90px,30vw,132px); height:clamp(90px,30vw,132px); flex:none; }
    .tc-crest svg{ display:block; width:100%; height:100%; }
    .tc-mono{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
      font-family:'Archivo'; font-weight:900; font-size:clamp(18px,7.5vw,34px); color:#fff; letter-spacing:.02em;
      text-shadow:0 2px 10px #0008; }
    .tc-stats{ margin-top:auto; }
    .tc-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:10px 6px; margin-top:8px; }
    .tc-stat .v{ font-family:'Archivo'; font-weight:800; font-size:clamp(15px,5vw,21px); color:#fff; line-height:1; }
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
    .tc-hint{ display:flex; align-items:center; gap:4px; font-size:9px; letter-spacing:.08em;
      text-transform:uppercase; color:#67799E; margin-top:8px; }
    .tc-hint svg{ width:10px; height:10px; flex:none; }
    .tc-next{ margin-top:10px; }
    .tc-next-opp{ font-family:'Archivo'; font-weight:900; font-size:clamp(18px,6.5vw,26px);
      line-height:1.05; margin-top:4px; }
    .tc-next-meta{ font-size:clamp(11px,3.2vw,13px); color:#C9D6F0; margin-top:6px; }
    .tc-next-loc{ font-size:clamp(10px,3vw,11.5px); color:#8FA4CC; margin-top:2px; }
    .tc-next-none{ font-size:14px; color:#8FA4CC; margin-top:8px; font-style:italic; }
    .tc-stat .v.sm{ font-size:clamp(11px,3.4vw,14px); line-height:1.2; }
    @media (prefers-reduced-motion: reduce){ .tc-flip{ animation:none } .tc-flip-inner{ transition:none } }
  `;

  const code = `TBCS-${t.leagueId}-${t.teamId}`;

  return (
    <div className="tc-wrap">
      <style>{css}</style>
      <div
        className={`tc-flip${flipped ? " is-flipped" : ""}`}
        onClick={toggleFlip}
        onKeyDown={onFlipKeyDown}
        role="button"
        tabIndex={0}
        aria-pressed={flipped}
        aria-label={flipped ? "Show season stats" : "Show next game and standing"}
      >
        <div className="tc-flip-inner">
          {/* front face */}
          <div className="tc face-front">
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
              <div className="tc-hint">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3" />
                  <path d="M18 3v4h-4M6 21v-4h4" />
                </svg>
                Tap for next game
              </div>
            </div>
          </div>

          {/* back face */}
          <div className="tc face-back">
            <div className="tc-net" />
            <div className="tc-inner">
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

              <div className="tc-next">
                <div className="tc-eyebrow">Next Up</div>
                {t.nextGame ? (
                  <>
                    <div className="tc-next-opp">
                      {t.nextGame.isHome ? "vs" : "@"} {t.nextGame.opponent}
                    </div>
                    <div className="tc-next-meta">{t.nextGame.date}{t.nextGame.time ? ` · ${t.nextGame.time}` : ""}</div>
                    {t.nextGame.location && <div className="tc-next-loc">{t.nextGame.location}</div>}
                  </>
                ) : (
                  <div className="tc-next-none">No games scheduled</div>
                )}
              </div>

              <div className="tc-rule" />

              <div className="tc-stats">
                <div className="tc-eyebrow">More Stats</div>
                <div className="tc-grid">
                  <div className="tc-stat">
                    <div className="v pos">{t.rank ? `#${t.rank}` : "-"}</div>
                    <div className="k">{t.divisionSize ? `of ${t.divisionSize}` : "Rank"}</div>
                  </div>
                  <div className="tc-stat"><div className="v">{t.awayRecord}</div><div className="k">Away</div></div>
                  <div className="tc-stat">
                    <div className="v sm">{t.location || "—"}</div>
                    <div className="k">Home Venue</div>
                  </div>
                </div>
              </div>

              <div className="tc-rule" />

              <div className="tc-foot">
                <div className="tc-div">{t.division}</div>
                <div className="tc-meta">{t.leagueDay} · {t.location}<br />{games} games played</div>
              </div>
              <div className="tc-code">{code}</div>
              <div className="tc-hint">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3" />
                  <path d="M18 3v4h-4M6 21v-4h4" />
                </svg>
                Tap to flip back
              </div>
            </div>
          </div>
        </div>

        <button className="tc-share" onClick={handleShare} aria-label="Share or download card">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 16V4M12 4 7 9M12 4l5 5" />
            <path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
          </svg>
        </button>
      </div>
    </div>
  );
}
