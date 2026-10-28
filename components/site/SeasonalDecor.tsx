"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { activeSeason, isSeasonKey, type SeasonAmount, type SeasonKey, type SeasonalSettings } from "@/lib/seasons";

// Seasonal decorations: falling leaves, snow, bats, confetti and so on, plus a
// garland (lights, bunting, icicles) hanging under the menu bar. Everything is
// decided in the visitor's browser after the page loads (Toronto dates), sits
// behind the menu bar, ignores clicks, and stays still for anyone who has
// "reduce motion" switched on.

type Kind =
  | "maple"
  | "leaf"
  | "flake"
  | "dot"
  | "bat"
  | "ghost"
  | "confetti"
  | "heart"
  | "shamrock"
  | "coin"
  | "blossom"
  | "poppy"
  | "star"
  | "sleigh"
  | "gift";
type Motion = "fall" | "rise" | "drift";

interface Mix {
  kind: Kind;
  motion: Motion;
  colors: string[];
  weight: number;
  size: [number, number];
  dur: [number, number];
  opacity?: [number, number];
}

type Garland =
  | { type: "lights"; colors: string[] }
  | { type: "bunting"; colors: string[]; spiders?: boolean }
  | { type: "leaves"; colors: string[] }
  | { type: "icicles" }
  | { type: "hearts"; colors: string[] }
  | { type: "poppies" };

interface Theme {
  mix: Mix[];
  /** Pieces that always appear, on top of the random mix (e.g. one sleigh). */
  always?: { mix: Mix; count: number }[];
  /** A short message shown in the middle of the garland (stays after the pieces fade). */
  message?: { text: string; short: string };
  bursts?: string[];
  countScale?: number;
  garland: Garland;
}

const FALL = ["#d9541e", "#e8892b", "#f2b134", "#b33a1f", "#a0522d"];
const SNOW = ["#ffffff", "#eef6ff", "#dbeeff"];
const GOLD = "#e2c47f";
const POPPY = "#c8102e";

const THEMES: Record<SeasonKey, Theme> = {
  fall: {
    mix: [
      { kind: "maple", motion: "fall", colors: FALL, weight: 0.55, size: [18, 28], dur: [12, 20], opacity: [0.6, 0.85] },
      { kind: "leaf", motion: "fall", colors: FALL, weight: 0.45, size: [14, 22], dur: [11, 18], opacity: [0.6, 0.85] },
    ],
    garland: { type: "leaves", colors: FALL },
  },
  halloween: {
    mix: [
      { kind: "bat", motion: "drift", colors: ["#3a2650"], weight: 0.4, size: [44, 68], dur: [13, 22], opacity: [0.9, 1] },
      { kind: "ghost", motion: "rise", colors: ["#f4f1ea"], weight: 0.2, size: [30, 42], dur: [18, 28], opacity: [0.6, 0.85] },
      { kind: "maple", motion: "fall", colors: ["#e8892b", "#f28c28", "#d9541e"], weight: 0.4, size: [20, 32], dur: [11, 18] },
    ],
    garland: { type: "bunting", colors: ["#f28c28", "#7b3fa0", "#e8e0c8"], spiders: true },
  },
  remembrance: {
    mix: [
      { kind: "poppy", motion: "fall", colors: [POPPY, "#b30d26", "#d4213a"], weight: 1, size: [22, 34], dur: [16, 26], opacity: [0.8, 0.95] },
    ],
    countScale: 0.6,
    garland: { type: "poppies" },
    message: { text: "Lest We Forget · Remembrance Day, November 11", short: "Lest We Forget" },
  },
  christmaseve: {
    mix: [
      { kind: "dot", motion: "fall", colors: SNOW, weight: 0.5, size: [5, 11], dur: [9, 16], opacity: [0.6, 0.95] },
      { kind: "flake", motion: "fall", colors: SNOW, weight: 0.3, size: [18, 28], dur: [12, 20], opacity: [0.75, 0.95] },
      { kind: "star", motion: "fall", colors: [GOLD, "#f2d58a", "#fff3c4"], weight: 0.2, size: [14, 22], dur: [12, 20], opacity: [0.8, 1] },
    ],
    always: [{ mix: { kind: "sleigh", motion: "drift", colors: [GOLD], weight: 1, size: [150, 190], dur: [13, 17], opacity: [0.95, 1] }, count: 1 }],
    countScale: 1.3,
    garland: { type: "lights", colors: ["#ffd23f", "#ff4d4d", "#fff1c1", "#4fbf73", "#ffd23f", "#ff4d4d"] },
  },
  boxingday: {
    mix: [
      { kind: "gift", motion: "fall", colors: ["#c8102e", "#1f7a3a", "#2f6fbf", "#e2c47f", "#7b3fa0"], weight: 0.55, size: [20, 30], dur: [11, 18] },
      { kind: "confetti", motion: "fall", colors: ["#c8102e", "#1f7a3a", GOLD, "#ffffff"], weight: 0.45, size: [11, 16], dur: [8, 13] },
    ],
    countScale: 1.2,
    garland: { type: "bunting", colors: ["#c8102e", GOLD, "#1f7a3a", "#ffffff"] },
  },
  christmas: {
    mix: [
      { kind: "dot", motion: "fall", colors: SNOW, weight: 0.55, size: [5, 11], dur: [9, 16], opacity: [0.6, 0.95] },
      { kind: "flake", motion: "fall", colors: SNOW, weight: 0.45, size: [18, 30], dur: [12, 20], opacity: [0.75, 0.95] },
    ],
    countScale: 1.4,
    garland: { type: "lights", colors: ["#ff4d4d", "#ffd23f", "#4fbf73", "#4da3ff", "#ff8c3a"] },
  },
  winter: {
    mix: [
      { kind: "dot", motion: "fall", colors: SNOW, weight: 0.6, size: [4, 10], dur: [10, 18], opacity: [0.55, 0.9] },
      { kind: "flake", motion: "fall", colors: SNOW, weight: 0.4, size: [16, 26], dur: [13, 21], opacity: [0.65, 0.9] },
    ],
    countScale: 1.1,
    garland: { type: "icicles" },
  },
  newyear: {
    mix: [
      { kind: "confetti", motion: "fall", colors: [GOLD, "#d9dde3", "#4fbf73", "#ffffff", "#f2d58a"], weight: 1, size: [11, 17], dur: [8, 14] },
    ],
    bursts: [GOLD, "#ffffff", "#7ed79b", "#f2d58a"],
    countScale: 1.3,
    garland: { type: "bunting", colors: [GOLD, "#d9dde3", "#4fbf73"] },
  },
  valentines: {
    mix: [
      { kind: "heart", motion: "rise", colors: ["#e0475b", "#f27a8a", "#ff9fb0", "#e8337a"], weight: 1, size: [16, 30], dur: [12, 20], opacity: [0.65, 0.92] },
    ],
    garland: { type: "hearts", colors: ["#e0475b", "#ff9fb0", "#c2185b"] },
  },
  stpatricks: {
    mix: [
      { kind: "shamrock", motion: "fall", colors: ["#2e9e4f", "#4fbf73", "#7ed79b", "#1f7a3a"], weight: 0.8, size: [20, 32], dur: [11, 18] },
      { kind: "coin", motion: "fall", colors: [GOLD, "#f2c94c"], weight: 0.2, size: [12, 18], dur: [9, 14] },
    ],
    garland: { type: "bunting", colors: ["#2e9e4f", "#f3eee3", GOLD] },
  },
  easter: {
    mix: [
      { kind: "blossom", motion: "fall", colors: ["#f8c8dc", "#fde68a", "#d9c6f2", "#bfe8d4", "#ffffff"], weight: 1, size: [16, 28], dur: [11, 18] },
    ],
    garland: { type: "bunting", colors: ["#f8c8dc", "#fde68a", "#d9c6f2", "#bfe8d4"] },
  },
  canadaday: {
    mix: [
      { kind: "maple", motion: "fall", colors: ["#ef3b2d", "#ef3b2d", "#ff5a4d", "#ffffff"], weight: 0.6, size: [22, 36], dur: [10, 17] },
      { kind: "confetti", motion: "fall", colors: ["#ef3b2d", "#ffffff"], weight: 0.4, size: [11, 16], dur: [8, 13] },
    ],
    bursts: ["#ef3b2d", "#ffffff", "#ff6b5e"],
    countScale: 1.2,
    garland: { type: "bunting", colors: ["#e3261c", "#ffffff"] },
  },
};

const BASE_COUNT: Record<SeasonAmount, number> = { light: 5, normal: 10, lots: 18 };
const FADE_MS = 1600;

function vars(v: Record<string, string | number>): CSSProperties {
  return v as unknown as CSSProperties;
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

// ---------------------------------------------------------------------------
// Artwork (simple SVG shapes)
// ---------------------------------------------------------------------------

const MAPLE =
  "50,2 57,18 66,13 63,36 77,24 80,32 95,29 88,45 96,50 74,66 78,76 54,72 53,98 47,98 46,72 22,76 26,66 4,50 12,45 5,29 20,32 23,24 37,36 34,13 43,18";
const HEART = "M50 88 C20 66 4 50 4 30 C4 14 16 4 30 4 C40 4 46 10 50 18 C54 10 60 4 70 4 C84 4 96 14 96 30 C96 50 80 66 50 88 Z";

function Art({ kind, color }: { kind: Kind; color: string }) {
  switch (kind) {
    case "maple":
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
          <polygon points={MAPLE} fill={color} />
        </svg>
      );
    case "leaf":
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
          <path d="M50 4 C72 18 86 42 78 66 C72 84 58 92 50 96 C42 92 28 84 22 66 C14 42 28 18 50 4 Z" fill={color} />
          <path d="M50 12 L50 98" stroke="rgba(0,0,0,0.25)" strokeWidth="4" />
        </svg>
      );
    case "flake":
      return (
        <svg viewBox="-50 -50 100 100" width="100%" height="100%" aria-hidden="true">
          <g stroke={color} strokeWidth="6" strokeLinecap="round" fill="none">
            {[0, 60, 120, 180, 240, 300].map((a) => (
              <g key={a} transform={`rotate(${a})`}>
                <path d="M0 0 L0 -44 M0 -26 L-11 -37 M0 -26 L11 -37 M0 -13 L-8 -21 M0 -13 L8 -21" />
              </g>
            ))}
          </g>
        </svg>
      );
    case "dot":
      return <span className="block h-full w-full rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />;
    case "bat":
      return (
        <svg viewBox="0 0 100 50" width="100%" height="100%" aria-hidden="true">
          <path
            d="M50 18 C47 12 44 10 42 12 C40 6 36 4 30 6 C24 2 14 2 4 10 C12 12 16 18 16 24 C22 20 28 22 30 28 C34 24 40 24 44 30 C46 34 48 36 50 38 C52 36 54 34 56 30 C60 24 66 24 70 28 C72 22 78 20 84 24 C84 18 88 12 96 10 C86 2 76 2 70 6 C64 4 60 6 58 12 C56 10 53 12 50 18 Z M46 15 L44 7 L48 12 L52 12 L56 7 L54 15 Z"
            fill={color}
            stroke="#f28c28"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "ghost":
      return (
        <svg viewBox="0 0 60 80" width="100%" height="100%" aria-hidden="true">
          <path d="M30 4 C14 4 6 16 6 32 L6 74 L14 66 L22 74 L30 66 L38 74 L46 66 L54 74 L54 32 C54 16 46 4 30 4 Z" fill={color} />
          <ellipse cx="22" cy="31" rx="4" ry="6" fill="#1b1d1c" />
          <ellipse cx="38" cy="31" rx="4" ry="6" fill="#1b1d1c" />
          <ellipse cx="30" cy="46" rx="5" ry="4" fill="#1b1d1c" />
        </svg>
      );
    case "confetti":
      return <span className="block h-full w-[60%] rounded-[2px]" style={{ background: color }} />;
    case "heart":
      return (
        <svg viewBox="0 0 100 92" width="100%" height="100%" aria-hidden="true">
          <path d={HEART} fill={color} />
        </svg>
      );
    case "shamrock":
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
          <path d="M50 50 C52 70 58 84 66 96" stroke={color} strokeWidth="6" fill="none" strokeLinecap="round" />
          {[0, 120, 240].map((a) => (
            <g key={a} transform={`rotate(${a} 50 50) translate(29 13) scale(0.42)`}>
              <path d={HEART} fill={color} />
            </g>
          ))}
        </svg>
      );
    case "coin":
      return (
        <svg viewBox="0 0 40 40" width="100%" height="100%" aria-hidden="true">
          <circle cx="20" cy="20" r="18" fill={color} stroke="#b8954a" strokeWidth="3" />
          <circle cx="20" cy="20" r="11" fill="none" stroke="#fff6d5" strokeWidth="2" opacity="0.7" />
        </svg>
      );
    case "blossom":
      return (
        <svg viewBox="-50 -50 100 100" width="100%" height="100%" aria-hidden="true">
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="0" cy="-24" rx="15" ry="22" fill={color} transform={`rotate(${a})`} />
          ))}
          <circle r="10" fill="#f2b134" />
        </svg>
      );
    case "poppy":
      return <PoppyArt color={color} />;
    case "star":
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
          <polygon
            points="50,4 61,37 96,37 68,58 78,92 50,72 22,92 32,58 4,37 39,37"
            fill={color}
            style={{ filter: `drop-shadow(0 0 4px ${color})` }}
          />
        </svg>
      );
    case "sleigh":
      return (
        <svg viewBox="0 0 200 100" width="100%" height="100%" aria-hidden="true">
          <g fill={color}>
            {/* Sleigh and runner */}
            <path d="M8 46 L18 46 C20 58 28 64 40 64 L62 64 C70 64 74 58 74 48 L80 48 C80 62 72 72 58 72 L36 72 C20 72 10 62 8 46 Z" />
            <path d="M4 80 L72 80 C80 80 84 76 86 70 L90 70 C88 80 82 86 72 86 L4 86 Z" />
            <rect x="22" y="70" width="4" height="12" />
            <rect x="56" y="70" width="4" height="12" />
            {/* Santa */}
            <circle cx="40" cy="34" r="8" />
            <path d="M30 46 C30 40 34 38 40 38 C46 38 50 40 50 46 Z" />
            <path d="M34 28 L48 30 L56 20 L46 24 Z" />
            {/* Reins */}
            <path d="M74 52 L132 44" stroke={color} strokeWidth="1.5" fill="none" />
          </g>
          {/* Two reindeer */}
          {[110, 156].map((x) => (
            <g key={x} fill={color} stroke={color} strokeLinecap="round">
              <ellipse cx={x} cy="48" rx="16" ry="7" stroke="none" />
              <path d={`M${x - 12} 52 L${x - 18} 66 M${x - 8} 52 L${x - 4} 66 M${x + 8} 52 L${x + 2} 64 M${x + 12} 52 L${x + 20} 62`} strokeWidth="3" fill="none" />
              <path d={`M${x + 12} 44 L${x + 20} 30`} strokeWidth="5" fill="none" />
              <ellipse cx={x + 24} cy="28" rx="6" ry="4" stroke="none" />
              <path d={`M${x + 20} 25 L${x + 16} 14 M${x + 18} 19 L${x + 12} 16 M${x + 22} 25 L${x + 24} 13 M${x + 23} 18 L${x + 28} 14`} strokeWidth="1.8" fill="none" />
            </g>
          ))}
          <circle cx="182" cy="28" r="2.6" fill="#ff4d4d" />
        </svg>
      );
    case "gift":
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
          <rect x="10" y="34" width="80" height="60" rx="4" fill={color} />
          <rect x="4" y="24" width="92" height="16" rx="3" fill={color} />
          <rect x="4" y="24" width="92" height="16" rx="3" fill="#000" opacity="0.12" />
          <rect x="44" y="24" width="12" height="70" fill="#f4eedd" />
          <path d="M50 24 C38 6 22 10 28 20 C32 26 42 25 50 24 Z M50 24 C62 6 78 10 72 20 C68 26 58 25 50 24 Z" fill="#f4eedd" />
        </svg>
      );
  }
}

/** A Remembrance poppy: four red petals and a black centre. */
function PoppyArt({ color }: { color: string }) {
  return (
    <svg viewBox="-50 -50 100 100" width="100%" height="100%" aria-hidden="true">
      {[0, 90, 180, 270].map((a) => (
        <circle key={a} cx="0" cy="-19" r="24" fill={color} stroke="#8e0a20" strokeWidth="2" transform={`rotate(${a + 45})`} />
      ))}
      <circle r="11" fill="#141414" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Deciding what to show (in the browser only)
// ---------------------------------------------------------------------------

interface Env {
  season: SeasonKey;
  reduced: boolean;
  phone: boolean;
}

function useSeasonEnv(settings: SeasonalSettings): Env | null {
  const [env, setEnv] = useState<Env | null>(null);
  useEffect(() => {
    // "?season=remembrance" (any theme name) previews a theme without changing the setting.
    const preview = new URLSearchParams(window.location.search).get("season");
    const season = isSeasonKey(preview) ? preview : activeSeason(settings.mode);
    const phone = window.matchMedia("(max-width: 767px)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!season || (phone && !settings.show_on_phones)) {
      setEnv(null);
      return;
    }
    setEnv({ season, reduced, phone });
  }, [settings.mode, settings.show_on_phones]);
  return env;
}

// ---------------------------------------------------------------------------
// Falling / rising / flying pieces
// ---------------------------------------------------------------------------

interface Piece {
  id: number;
  kind: Kind;
  motion: Motion;
  color: string;
  x: number;
  y: number;
  size: number;
  dur: number;
  delay: number;
  sway: number;
  swayDur: number;
  spinDur: number;
  opacity: number;
  reverse: boolean;
  flap: number;
}

interface Burst {
  id: number;
  x: number;
  y: number;
  color: string;
  dur: number;
  delay: number;
  radius: number;
}

function makePieces(theme: Theme, amount: SeasonAmount, phone: boolean): Piece[] {
  const count = Math.round(BASE_COUNT[amount] * (theme.countScale ?? 1) * (phone ? 0.55 : 1));
  const total = theme.mix.reduce((s, m) => s + m.weight, 0);
  const pieces: Piece[] = [];
  for (let i = 0; i < count; i++) {
    let r = Math.random() * total;
    const mix = theme.mix.find((m) => (r -= m.weight) <= 0) ?? theme.mix[0];
    const dur = rand(mix.dur[0], mix.dur[1]);
    pieces.push({
      id: i,
      kind: mix.kind,
      motion: mix.motion,
      color: pick(mix.colors),
      x: rand(0, 98),
      y: rand(10, 60),
      size: rand(mix.size[0], mix.size[1]) * (phone ? 0.85 : 1),
      dur,
      delay: -rand(0, dur),
      sway: rand(10, 42),
      swayDur: rand(2.4, 5),
      spinDur: rand(3.5, 9),
      opacity: mix.opacity ? rand(mix.opacity[0], mix.opacity[1]) : rand(0.8, 0.98),
      reverse: Math.random() < 0.5,
      flap: rand(0.16, 0.26),
    });
  }
  for (const extra of theme.always ?? []) {
    for (let i = 0; i < extra.count; i++) pieces.push(piece(pieces.length, extra.mix, phone));
  }
  return pieces;
}

function piece(id: number, mix: Mix, phone: boolean): Piece {
  const dur = rand(mix.dur[0], mix.dur[1]);
  return {
    id,
    kind: mix.kind,
    motion: mix.motion,
    color: pick(mix.colors),
    x: rand(0, 98),
    y: rand(12, 40),
    size: rand(mix.size[0], mix.size[1]) * (phone ? 0.7 : 1),
    dur,
    // Start the sleigh just off screen so it crosses while the pieces are showing.
    delay: -rand(0, dur * 0.15),
    sway: rand(10, 30),
    swayDur: rand(2.4, 5),
    spinDur: rand(3.5, 9),
    opacity: mix.opacity ? rand(mix.opacity[0], mix.opacity[1]) : 0.95,
    reverse: Math.random() < 0.5,
    flap: rand(0.16, 0.26),
  };
}

function makeBursts(colors: string[], phone: boolean): Burst[] {
  return Array.from({ length: phone ? 2 : 4 }, (_, i) => ({
    id: i,
    x: rand(8, 92),
    y: rand(14, 48),
    color: pick(colors),
    dur: rand(5.5, 9),
    delay: rand(0, 6),
    radius: rand(36, 64) * (phone ? 0.75 : 1),
  }));
}

function PieceView({ p }: { p: Piece }) {
  const spins = p.kind === "maple" || p.kind === "leaf" || p.kind === "confetti" || p.kind === "coin" ? "season-flutter" : "season-spin";
  const art = <Art kind={p.kind} color={p.color} />;

  if (p.motion === "drift") {
    return (
      <div
        className="season-p season-drift"
        style={vars({
          top: `${p.y}vh`,
          width: `${p.size}px`,
          height: `${p.size / 2}px`,
          opacity: p.opacity,
          "--dur": `${p.dur}s`,
          "--delay": `${p.delay}s`,
          animationDirection: p.reverse ? "reverse" : "normal",
        })}
      >
        <div className="season-bob h-full w-full" style={vars({ "--sway": `${p.sway / 2}px`, "--sway-dur": `${p.swayDur}s` })}>
          <div className="h-full w-full" style={p.reverse ? { transform: "scaleX(-1)" } : undefined}>
            {p.kind === "sleigh" ? (
              art
            ) : (
              <div className="season-flap h-full w-full" style={vars({ "--flap": `${p.flap.toFixed(2)}s` })}>
                {art}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`season-p ${p.motion === "rise" ? "season-rise" : "season-fall"}`}
      style={vars({
        left: `${p.x}%`,
        width: `${p.size}px`,
        height: `${p.size}px`,
        opacity: p.opacity,
        "--dur": `${p.dur}s`,
        "--delay": `${p.delay}s`,
      })}
    >
      <div className="season-sway h-full w-full" style={vars({ "--sway": `${p.sway}px`, "--sway-dur": `${p.swayDur}s` })}>
        {p.kind === "ghost" || p.kind === "heart" || p.kind === "dot" || p.kind === "poppy" ? (
          <div className="h-full w-full">{art}</div>
        ) : (
          <div className={`${spins} flex h-full w-full items-center justify-center`} style={vars({ "--spin-dur": `${p.spinDur}s` })}>
            {art}
          </div>
        )}
      </div>
    </div>
  );
}

function BurstView({ b }: { b: Burst }) {
  const rays = 18;
  return (
    <div
      className="season-burst"
      style={vars({ left: `${b.x}%`, top: `${b.y}%`, "--dur": `${b.dur}s`, "--delay": `${b.delay}s` })}
    >
      {Array.from({ length: rays }, (_, i) => (
        <span
          key={i}
          className="season-ray"
          style={{
            background: b.color,
            boxShadow: `0 0 8px ${b.color}`,
            transform: `rotate(${(360 / rays) * i}deg) translateY(-${b.radius}px)`,
          }}
        />
      ))}
    </div>
  );
}

/** The full-screen layer of seasonal pieces (rendered once in the site layout). */
export function SeasonalDecor({ settings }: { settings: SeasonalSettings }) {
  const env = useSeasonEnv(settings);
  const content = useMemo(() => {
    if (!env || env.reduced) return null;
    const theme = THEMES[env.season];
    return {
      pieces: makePieces(theme, settings.amount, env.phone),
      bursts: theme.bursts ? makeBursts(theme.bursts, env.phone) : [],
    };
  }, [env, settings.amount]);

  // Play for a while after the page loads, then fade out (0 = keep going).
  const [phase, setPhase] = useState<"on" | "fading" | "off">("on");
  const seconds = settings.duration_seconds;
  useEffect(() => {
    if (!content || seconds <= 0) return;
    setPhase("on");
    const fade = window.setTimeout(() => setPhase("fading"), seconds * 1000);
    const off = window.setTimeout(() => setPhase("off"), seconds * 1000 + FADE_MS);
    return () => {
      window.clearTimeout(fade);
      window.clearTimeout(off);
    };
  }, [content, seconds]);

  if (!content || phase === "off") return null;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-30 overflow-hidden transition-opacity ease-out"
      style={{ opacity: phase === "fading" ? 0 : 1, transitionDuration: `${FADE_MS}ms` }}
      data-season={env?.season}
    >
      {content.bursts.map((b) => (
        <BurstView key={`b${b.id}`} b={b} />
      ))}
      {content.pieces.map((p) => (
        <PieceView key={p.id} p={p} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Garland hanging under the menu bar
// ---------------------------------------------------------------------------

const UNITS = 72;

function Row({ unit, height, children }: { unit: number; height: number; children: (i: number) => ReactNode }) {
  return (
    <div className="flex" style={{ height }}>
      {Array.from({ length: UNITS }, (_, i) => (
        <svg key={i} width={unit} height={height} viewBox={`0 0 ${unit} ${height}`} className="shrink-0 overflow-visible" aria-hidden="true">
          {children(i)}
        </svg>
      ))}
    </div>
  );
}

function Spider({ left, delay }: { left: string; delay: string }) {
  return (
    <div className="season-bob-spider absolute top-[-70px]" style={vars({ left, "--delay": delay })}>
      <svg width="30" height="150" viewBox="0 0 30 150" aria-hidden="true">
        <line x1="15" y1="0" x2="15" y2="118" stroke="#e8e0c8" strokeWidth="1" opacity="0.7" />
        <g stroke="#e8e0c8" strokeWidth="1.6" fill="none" strokeLinecap="round">
          <path d="M11 124 L3 116 L1 110 M11 127 L2 124 L0 119 M11 130 L2 133 L0 138 M12 133 L5 141 L4 146" />
          <path d="M19 124 L27 116 L29 110 M19 127 L28 124 L30 119 M19 130 L28 133 L30 138 M18 133 L25 141 L26 146" />
        </g>
        <circle cx="15" cy="121" r="4.5" fill="#2b1d3a" stroke="#e8e0c8" strokeWidth="1.2" />
        <ellipse cx="15" cy="131" rx="6.5" ry="7.5" fill="#2b1d3a" stroke="#e8e0c8" strokeWidth="1.2" />
        <circle cx="13.3" cy="120.5" r="1" fill="#f28c28" />
        <circle cx="16.7" cy="120.5" r="1" fill="#f28c28" />
      </svg>
    </div>
  );
}

function GarlandArt({ garland, phone }: { garland: Garland; phone: boolean }) {
  switch (garland.type) {
    case "lights":
      return (
        <Row unit={44} height={30}>
          {(i) => {
            const c = garland.colors[i % garland.colors.length];
            return (
              <>
                <path d="M0 3 Q22 11 44 3" stroke="#3d4a40" strokeWidth="1.6" fill="none" />
                <rect x="19.5" y="6.6" width="5" height="4" rx="1" fill="#6b706b" />
                <ellipse
                  className="season-twinkle"
                  cx="22"
                  cy="17"
                  rx="5"
                  ry="7.2"
                  fill={c}
                  style={vars({ filter: `drop-shadow(0 0 4px ${c})`, "--delay": `${(i % 7) * -0.37}s` })}
                />
              </>
            );
          }}
        </Row>
      );
    case "bunting":
      return (
        <>
          <Row unit={34} height={28}>
            {(i) => (
              <>
                <path d="M0 2 Q17 6 34 2" stroke="#cfc8b6" strokeWidth="1" fill="none" opacity="0.8" />
                <path d="M4 3.6 L30 3.6 L17 24 Z" fill={garland.colors[i % garland.colors.length]} opacity="0.95" />
              </>
            )}
          </Row>
          {garland.spiders && (
            <>
              {!phone && <Spider left="14%" delay="-1.2s" />}
              <Spider left={phone ? "62%" : "71%"} delay="0s" />
            </>
          )}
        </>
      );
    case "leaves":
      return (
        <Row unit={34} height={30}>
          {(i) => (
            <>
              <path d="M0 2 Q17 6 34 2" stroke="#8c6a43" strokeWidth="1.2" fill="none" />
              <g transform={`translate(17 4) rotate(${i % 2 ? 14 : -14}) translate(-9 0) scale(0.18)`}>
                <polygon points={MAPLE} fill={garland.colors[(i * 3) % garland.colors.length]} />
              </g>
            </>
          )}
        </Row>
      );
    case "icicles":
      return (
        <Row unit={28} height={26}>
          {(i) => (
            <>
              <rect x="0" y="0" width="28" height="3" fill="#f4f9ff" opacity="0.9" />
              <path d={i % 2 ? "M2 2 L6 2 L4 14 Z" : "M3 2 L7 2 L5 19 Z"} fill="#dff3ff" opacity="0.85" />
              <path d={i % 3 ? "M11 2 L17 2 L14 23 Z" : "M11 2 L16 2 L13.5 15 Z"} fill="#eaf7ff" opacity="0.9" />
              <path d="M21 2 L25 2 L23 11 Z" fill="#dff3ff" opacity="0.8" />
            </>
          )}
        </Row>
      );
    case "poppies":
      return (
        <Row unit={40} height={30}>
          {(i) => (
            <>
              <path d="M0 3 Q20 9 40 3" stroke="#3d4a40" strokeWidth="1.2" fill="none" />
              <line x1="20" y1="6" x2="20" y2="10" stroke="#3d4a40" strokeWidth="1" />
              <g transform={`translate(20 18) scale(0.17) rotate(${(i % 3) * 20})`}>
                {[0, 90, 180, 270].map((a) => (
                  <circle key={a} cx="0" cy="-19" r="24" fill={POPPY} stroke="#8e0a20" strokeWidth="3" transform={`rotate(${a + 45})`} />
                ))}
                <circle r="11" fill="#141414" />
              </g>
            </>
          )}
        </Row>
      );
    case "hearts":
      return (
        <Row unit={34} height={28}>
          {(i) => (
            <>
              <path d="M0 2 Q17 6 34 2" stroke="#cfc8b6" strokeWidth="1" fill="none" opacity="0.8" />
              <line x1="17" y1="4" x2="17" y2="9" stroke="#cfc8b6" strokeWidth="1" opacity="0.8" />
              <g transform="translate(10 8) scale(0.14)">
                <path d={HEART} fill={garland.colors[i % garland.colors.length]} />
              </g>
            </>
          )}
        </Row>
      );
  }
}

/** Garland under the menu bar (rendered inside the header). */
export function SeasonalGarland({ settings, hidden = false }: { settings: SeasonalSettings; hidden?: boolean }) {
  const env = useSeasonEnv(settings);
  if (!env || hidden) return null;
  const { garland, message } = THEMES[env.season];
  const tall = garland.type === "bunting" && garland.spiders;
  return (
    <div
      className={`pointer-events-none absolute inset-x-0 top-full overflow-hidden ${tall ? "h-[150px]" : "h-8"}`}
      data-season-garland={env.season}
    >
      <div aria-hidden="true">
        <GarlandArt garland={garland} phone={env.phone} />
      </div>
      {message && (
        <p className="absolute left-1/2 top-[3px] m-0 -translate-x-1/2 whitespace-nowrap rounded-full border border-[#c8102e]/70 bg-ink/90 px-4 py-[3px] text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-cream shadow-lg">
          <span className="sm:hidden">{message.short}</span>
          <span className="hidden sm:inline">{message.text}</span>
        </p>
      )}
    </div>
  );
}
