import React, { useState, useCallback, useEffect } from "react";
import TeamCard from "./TeamCard.jsx";

const CARD_WIDTH = 412;
const GAP = 16;
const STEP = CARD_WIDTH + GAP;
const PEEK = 150;
const VIEWPORT_WIDTH = CARD_WIDTH + PEEK * 2;
const VIEWPORT_HEIGHT = 596;

const DIVISION_ACCENTS = {
  c: "#FFC247", r: "#38D6C4", ia: "#FF7A4D", ib: "#9B8CFF", ic: "#5AA9FF",
};

const css = `
  .carousel-wrap { display: flex; flex-direction: column; align-items: center; gap: 20px; width: 100%; }
  .carousel-filters { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
  .carousel-filters button {
    border: none; border-radius: 999px; padding: 7px 18px;
    font-size: 11px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase;
    cursor: pointer; background: #ffffff0a; box-shadow: inset 0 0 0 1px #ffffff20;
    color: #9DB2D8; transition: background .2s ease, color .2s ease, box-shadow .2s ease;
  }
  .carousel-filters button:hover { background: #ffffff14; color: #EAF1FF; }
  .carousel-filters button.active { color: #0A1730; box-shadow: none; }
  .carousel { display: flex; align-items: center; justify-content: center; gap: 12px; width: 100%; }
  .carousel .stage { display: flex; flex-direction: column; align-items: center; }
  .carousel .viewport {
    position: relative; width: ${VIEWPORT_WIDTH}px; max-width: calc(100vw - 96px);
    height: ${VIEWPORT_HEIGHT}px; overflow: hidden;
  }
  .carousel .slide {
    position: absolute; top: 0; left: 50%; width: ${CARD_WIDTH}px;
    transform: translateX(calc(-50% + var(--offset, 0px))) scale(var(--scale, 1));
    opacity: var(--opacity, 0);
    transition: transform .5s cubic-bezier(.22,.7,.2,1), opacity .5s ease;
    pointer-events: var(--pe, none);
  }
  .carousel .slide.is-current { z-index: 3; }
  .carousel .slide.is-near { cursor: pointer; }
  .carousel .counter { font-size: 13px; color: #9DB2D8; margin-top: 4px; font-variant-numeric: tabular-nums; }
  .carousel .nav {
    flex: none; width: 44px; height: 44px; border-radius: 50%; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    background: #ffffff0f; box-shadow: inset 0 0 0 1px #ffffff1f; color: #EAF1FF;
    font-size: 22px; line-height: 1; transition: background .15s ease, transform .15s ease;
  }
  .carousel .nav:hover { background: #ffffff1f; transform: scale(1.05); }
  .carousel .nav:active { transform: scale(.95); }
  @media (max-width: 520px) {
    .carousel { gap: 8px; }
    .carousel .nav { width: 36px; height: 36px; font-size: 18px; }
  }
`;

// Derive unique divisions from teams in the order they appear (already division-sorted by getStandings).
function getDivisions(teams) {
  const seen = new Set();
  return teams
    .filter(t => { if (seen.has(t.divisionCode)) return false; seen.add(t.divisionCode); return true; })
    .map(t => ({ code: t.divisionCode, label: t.division }));
}

export default function CardCarousel({ teams = [] }) {
  const [index, setIndex] = useState(0);
  const [activeDiv, setActiveDiv] = useState(null);

  const divisions = getDivisions(teams);
  const filtered = activeDiv ? teams.filter(t => t.divisionCode === activeDiv) : teams;
  const count = filtered.length;

  function setFilter(code) {
    setActiveDiv(code);
    setIndex(0);
  }

  const go = useCallback((delta) => {
    setIndex((i) => (i + delta + count) % count);
  }, [count]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  if (!teams.length) return <p>No teams found.</p>;

  return (
    <div className="carousel-wrap">
      <style>{css}</style>

      <div className="carousel-filters">
        <button
          className={activeDiv === null ? "active" : ""}
          style={activeDiv === null ? { background: "#EAF1FF" } : {}}
          onClick={() => setFilter(null)}
        >
          All
        </button>
        {divisions.map(({ code, label }) => {
          const accent = DIVISION_ACCENTS[code] || "#EAF1FF";
          const isActive = activeDiv === code;
          return (
            <button
              key={code}
              className={isActive ? "active" : ""}
              style={isActive ? { background: accent } : {}}
              onClick={() => setFilter(code)}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="carousel">
        <button className="nav prev" onClick={() => go(-1)} aria-label="Previous team">‹</button>
        <div className="stage">
          <div className="viewport">
            {filtered.map((team, i) => {
              const rel = i - index;
              const isCurrent = rel === 0;
              const isNear = Math.abs(rel) === 1;
              const style = {
                "--offset": `${rel * STEP}px`,
                "--scale": isCurrent ? 1 : isNear ? 0.92 : 0.82,
                "--opacity": isCurrent ? 1 : isNear ? 0.75 : 0,
                "--pe": isNear ? "auto" : "none",
              };
              return (
                <div
                  key={team.teamId}
                  className={`slide${isCurrent ? " is-current" : ""}${isNear ? " is-near" : ""}`}
                  style={style}
                  onClick={isNear ? () => go(rel) : undefined}
                >
                  <TeamCard team={team} />
                </div>
              );
            })}
          </div>
          <div className="counter">{index + 1} / {count}</div>
        </div>
        <button className="nav next" onClick={() => go(1)} aria-label="Next team">›</button>
      </div>
    </div>
  );
}
