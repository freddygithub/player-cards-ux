import React, { useState, useCallback, useEffect, useRef } from "react";
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
  .carousel-controls { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; align-items: stretch; width: 100%; max-width: 460px; }
  .search-box {
    flex: 1 1 200px; display: flex; align-items: center; gap: 8px;
    background: #ffffff0a; box-shadow: inset 0 0 0 1px #ffffff20; border-radius: 999px;
    padding: 0 14px; height: 40px; transition: box-shadow .2s ease, background .2s ease;
  }
  .search-box:focus-within { background: #ffffff14; box-shadow: inset 0 0 0 1px #ffffff40; }
  .search-box svg { flex: none; width: 15px; height: 15px; color: #7C8FB5; }
  .search-box input {
    flex: 1; border: none; outline: none; background: transparent; color: #EAF1FF;
    font-family: inherit; font-size: 13px; min-width: 0;
  }
  .search-box input::placeholder { color: #7C8FB5; }
  .search-clear {
    flex: none; border: none; cursor: pointer; background: #ffffff14; color: #C9D6F0;
    width: 18px; height: 18px; border-radius: 50%; font-size: 13px; line-height: 1;
    display: flex; align-items: center; justify-content: center; transition: background .15s ease;
  }
  .search-clear:hover { background: #ffffff28; color: #fff; }
  .division-dropdown { position: relative; flex: none; }
  .dropdown-trigger {
    height: 40px; display: flex; align-items: center; gap: 8px; white-space: nowrap;
    border: none; border-radius: 999px; padding: 0 14px 0 12px; cursor: pointer;
    background: #ffffff0a; box-shadow: inset 0 0 0 1px #ffffff20;
    color: #EAF1FF; font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase;
    transition: background .2s ease, box-shadow .2s ease;
  }
  .dropdown-trigger:hover { background: #ffffff14; }
  .dropdown-trigger[aria-expanded="true"] { background: #ffffff18; box-shadow: inset 0 0 0 1px #ffffff40; }
  .dropdown-trigger .dot { width: 8px; height: 8px; border-radius: 50%; flex: none; box-shadow: 0 0 6px currentColor; }
  .dropdown-trigger .chevron { width: 11px; height: 11px; flex: none; color: #7C8FB5; transition: transform .2s ease; }
  .dropdown-trigger .chevron.open { transform: rotate(180deg); }
  .dropdown-menu {
    position: absolute; top: calc(100% + 8px); right: 0; z-index: 30; min-width: 190px;
    list-style: none; margin: 0; padding: 6px; border-radius: 14px;
    background: #0E1F42ee; backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
    box-shadow: 0 16px 40px -12px #000A, inset 0 0 0 1px #ffffff1c;
    animation: dd-in .16s cubic-bezier(.22,.7,.2,1) both;
  }
  @keyframes dd-in { from { opacity: 0; transform: translateY(-4px) scale(.98); } to { opacity: 1; transform: none; } }
  .dropdown-menu li { list-style: none; }
  .dropdown-menu button {
    width: 100%; display: flex; align-items: center; gap: 10px; text-align: left;
    border: none; background: transparent; cursor: pointer; border-radius: 9px;
    padding: 9px 10px; font-size: 12.5px; font-weight: 600; color: #C9D6F0;
    transition: background .15s ease, color .15s ease;
  }
  .dropdown-menu button:hover { background: #ffffff14; color: #EAF1FF; }
  .dropdown-menu button.active { background: #ffffff1c; color: #fff; }
  .dropdown-menu button .dot { width: 9px; height: 9px; border-radius: 50%; flex: none; box-shadow: 0 0 6px currentColor; }
  .dropdown-menu button .check { margin-left: auto; width: 13px; height: 13px; flex: none; color: #EAF1FF; }
  .carousel-empty { color: #9DB2D8; font-size: 13px; padding: 60px 0; text-align: center; }
  @media (max-width: 700px) {
    .carousel-controls { max-width: 100%; }
  }
  .carousel { display: flex; align-items: center; justify-content: center; gap: 12px; width: 100%; }
  .carousel .stage { display: flex; flex-direction: column; align-items: center; }
  .carousel .viewport {
    position: relative; width: ${VIEWPORT_WIDTH}px; max-width: calc(100vw - 96px);
    height: ${VIEWPORT_HEIGHT}px; overflow: hidden;
    mask-image: linear-gradient(to right, transparent 0%, #000 14%, #000 86%, transparent 100%);
    -webkit-mask-image: linear-gradient(to right, transparent 0%, #000 14%, #000 86%, transparent 100%);
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
  .carousel-mobile { width: 100%; flex-direction: column; gap: 10px; }
  .mobile-stage {
    position: relative; width: 100%; max-width: 420px;
    display: flex; align-items: center; justify-content: center;
    touch-action: pan-y;
  }
  .mobile-stage .nav.overlay {
    position: absolute; top: 50%; transform: translateY(-50%); z-index: 10;
    width: 38px; height: 38px; font-size: 18px;
    background: #0A1730b3; box-shadow: inset 0 0 0 1px #ffffff2a;
  }
  .mobile-stage .nav.overlay:active { transform: translateY(-50%) scale(.95); }
  .mobile-stage .nav.overlay.prev { left: 2px; }
  .mobile-stage .nav.overlay.next { right: 2px; }
  .mobile-card { width: 100%; }
  .mobile-card.slide-next { animation: tc-slide-next .35s cubic-bezier(.22,.7,.2,1) both; }
  .mobile-card.slide-prev { animation: tc-slide-prev .35s cubic-bezier(.22,.7,.2,1) both; }
  @keyframes tc-slide-next {
    from { transform: translateX(28px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes tc-slide-prev {
    from { transform: translateX(-28px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @media (prefers-reduced-motion: reduce) {
    .mobile-card.slide-next, .mobile-card.slide-prev { animation: none; }
  }
`;

// Derive unique divisions from teams in the order they appear (already division-sorted by getStandings).
function getDivisions(teams) {
  const seen = new Set();
  return teams
    .filter(t => { if (seen.has(t.divisionCode)) return false; seen.add(t.divisionCode); return true; })
    .map(t => ({ code: t.divisionCode, label: t.division }));
}

const MOBILE_QUERY = "(max-width: 700px)";

export default function CardCarousel({ teams = [] }) {
  const [index, setIndex] = useState(0);
  const [activeDiv, setActiveDiv] = useState(null);
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(MOBILE_QUERY).matches : false
  );
  const [direction, setDirection] = useState("next");
  const touchStartX = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!dropdownOpen) return;
    function onPointerDown(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setDropdownOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [dropdownOpen]);

  const divisions = getDivisions(teams);
  const activeDivision = divisions.find(d => d.code === activeDiv);
  const query = search.trim().toLowerCase();
  const filtered = teams
    .filter(t => !activeDiv || t.divisionCode === activeDiv)
    .filter(t => !query || t.name.toLowerCase().includes(query));
  const count = filtered.length;

  useEffect(() => {
    setIndex(0);
  }, [activeDiv, search]);

  function setFilter(code) {
    setActiveDiv(code);
    setDropdownOpen(false);
  }

  const go = useCallback((delta) => {
    setDirection(delta > 0 ? "next" : "prev");
    setIndex((i) => (i + delta + count) % count);
  }, [count]);

  useEffect(() => {
    function onKey(e) {
      if (document.activeElement?.tagName === "INPUT") return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  function onTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
  }

  function onTouchEnd(e) {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) > 40) go(dx > 0 ? -1 : 1);
  }

  if (!teams.length) return <p>No teams found.</p>;

  return (
    <div className="carousel-wrap">
      <style>{css}</style>

      <div className="carousel-controls">
        <div className="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teams…"
            aria-label="Search teams"
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch("")} aria-label="Clear search">×</button>
          )}
        </div>

        <div className="division-dropdown" ref={dropdownRef}>
          <button
            type="button"
            className="dropdown-trigger"
            onClick={() => setDropdownOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={dropdownOpen}
          >
            <span className="dot" style={{ background: activeDiv ? DIVISION_ACCENTS[activeDiv] : "#EAF1FF", color: activeDiv ? DIVISION_ACCENTS[activeDiv] : "#EAF1FF" }} />
            {activeDivision ? activeDivision.label : "All Divisions"}
            <svg className={`chevron${dropdownOpen ? " open" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          {dropdownOpen && (
            <ul className="dropdown-menu" role="listbox">
              <li>
                <button
                  type="button"
                  className={activeDiv === null ? "active" : ""}
                  onClick={() => setFilter(null)}
                  role="option"
                  aria-selected={activeDiv === null}
                >
                  <span className="dot" style={{ background: "#EAF1FF", color: "#EAF1FF" }} />
                  All Divisions
                  {activeDiv === null && (
                    <svg className="check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </button>
              </li>
              {divisions.map(({ code, label }) => {
                const accent = DIVISION_ACCENTS[code] || "#EAF1FF";
                const isActive = activeDiv === code;
                return (
                  <li key={code}>
                    <button
                      type="button"
                      className={isActive ? "active" : ""}
                      onClick={() => setFilter(code)}
                      role="option"
                      aria-selected={isActive}
                    >
                      <span className="dot" style={{ background: accent, color: accent }} />
                      {label}
                      {isActive && (
                        <svg className="check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {count === 0 ? (
        <p className="carousel-empty">No teams match your search.</p>
      ) : isMobile ? (
        <div className="carousel carousel-mobile">
          <div
            className="mobile-stage"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <button className="nav overlay prev" onClick={() => go(-1)} aria-label="Previous team">‹</button>
            <div className={`mobile-card slide-${direction}`} key={filtered[index]?.teamId}>
              <TeamCard team={filtered[index]} />
            </div>
            <button className="nav overlay next" onClick={() => go(1)} aria-label="Next team">›</button>
          </div>
          <div className="counter">{index + 1} / {count}</div>
        </div>
      ) : (
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
                  "--pe": (isCurrent || isNear) ? "auto" : "none",
                };
                return (
                  <div
                    key={team.teamId}
                    className={`slide${isCurrent ? " is-current" : ""}${isNear ? " is-near" : ""}`}
                    style={style}
                    onClickCapture={isNear ? (e) => { e.stopPropagation(); go(rel); } : undefined}
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
      )}
    </div>
  );
}
