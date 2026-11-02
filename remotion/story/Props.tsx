import React from "react";
import { INK } from "./theme";
import { Face, Expression } from "./Face";

/**
 * Original prop library. Every prop is drawn in a 200×200 box centred on (0,0)
 * with the same thick outline as the characters, so anything can be given a face.
 */
type Art = { draw: (t: number, o: Opts) => React.ReactNode; face?: { x: number; y: number; s: number }; aliases?: string[] };
type Opts = { color?: string; color2?: string; glow?: boolean };

const sw = 6;
const st = { stroke: INK, strokeWidth: sw, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

const star5 = (r: number, ri: number, n = 5) => {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (Math.PI * i) / n - Math.PI / 2;
    const rr = i % 2 ? ri : r;
    pts.push(`${(Math.cos(a) * rr).toFixed(1)},${(Math.sin(a) * rr).toFixed(1)}`);
  }
  return pts.join(" ");
};

const spiky = (r: number, ri: number, n: number, wob = 0, t = 0) => {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (Math.PI * i) / n;
    const rr = (i % 2 ? ri : r) + Math.sin(t * 6 + i) * wob;
    pts.push(`${(Math.cos(a) * rr).toFixed(1)},${(Math.sin(a) * rr).toFixed(1)}`);
  }
  return pts.join(" ");
};

export const PROPS: Record<string, Art> = {
  sun: {
    draw: (t, o) => (
      <g>
        <polygon points={spiky(98, 74, 18, 3, t)} fill={o.color ?? "#ffc21a"} {...st} />
        <circle r={66} fill={o.color2 ?? "#fff3a0"} {...st} />
      </g>
    ),
    face: { x: 0, y: 4, s: 0.55 },
  },
  moon: {
    draw: (_t, o) => (
      <g>
        <circle r={80} fill={o.color ?? "#f1ecd0"} {...st} />
        <circle cx={-30} cy={-30} r={14} fill="#d9d2ae" />
        <circle cx={34} cy={30} r={20} fill="#d9d2ae" />
        <circle cx={-20} cy={44} r={9} fill="#d9d2ae" />
      </g>
    ),
    face: { x: 0, y: 0, s: 0.55 },
  },
  earth: {
    draw: (t) => (
      <g>
        <circle r={88} fill="#3b8df0" {...st} />
        <g transform={`translate(${(t * 6) % 40 - 20} 0)`}>
          <path d="M-62 -40 Q-40 -66 -8 -54 Q10 -40 -6 -20 Q-30 -10 -24 14 Q-40 30 -60 10 Q-80 -14 -62 -40Z" fill="#4ccf6a" stroke={INK} strokeWidth={4} />
          <path d="M20 -70 Q50 -66 64 -40 Q56 -24 36 -30 Q20 -40 20 -70Z" fill="#4ccf6a" stroke={INK} strokeWidth={4} />
          <path d="M14 10 Q40 0 58 20 Q66 50 40 66 Q18 70 16 46 Q4 30 14 10Z" fill="#4ccf6a" stroke={INK} strokeWidth={4} />
        </g>
        <circle r={88} fill="none" {...st} />
      </g>
    ),
    face: { x: 0, y: 4, s: 0.55 },
    aliases: ["globe_planet", "world"],
  },
  planet: {
    draw: (_t, o) => {
      const ring = (d: string) => (
        <>
          <path d={d} fill="none" stroke={INK} strokeWidth={22} strokeLinecap="round" />
          <path d={d} fill="none" stroke={o.color2 ?? "#ffd27a"} strokeWidth={11} strokeLinecap="round" />
        </>
      );
      return (
        <g transform="rotate(-16)">
          {ring("M-98 0 A98 28 0 0 1 98 0")}
          <circle r={60} fill={o.color ?? "#ff8f5a"} {...st} />
          <path d="M-54 -22 Q0 -34 54 -22 M-58 12 Q0 0 58 12" stroke="#00000022" strokeWidth={10} fill="none" />
          {ring("M-98 0 A98 28 0 0 0 98 0")}
        </g>
      );
    },
    face: { x: 0, y: -14, s: 0.38 },
    aliases: ["saturn"],
  },
  star: {
    draw: (t, o) => <polygon points={star5(92, 42)} fill={o.color ?? "#ffd23f"} {...st} transform={`rotate(${Math.sin(t * 2) * 6})`} />,
    face: { x: 0, y: 10, s: 0.4 },
  },
  blackhole: {
    draw: (t) => (
      <g>
        <g transform={`rotate(${t * 40})`}>
          <ellipse rx={100} ry={36} fill="none" stroke="#ff9d2e" strokeWidth={16} />
          <ellipse rx={100} ry={36} fill="none" stroke="#ffe066" strokeWidth={6} />
        </g>
        <circle r={58} fill="#ffcc4d" />
        <circle r={50} fill="#0b0b10" stroke="#ff7b1c" strokeWidth={6} />
        <g transform={`rotate(${t * 40})`}>
          <path d="M-100 0 A100 36 0 0 0 100 0" fill="none" stroke="#ff9d2e" strokeWidth={16} />
          <path d="M-100 0 A100 36 0 0 0 100 0" fill="none" stroke="#ffe066" strokeWidth={6} />
        </g>
      </g>
    ),
    face: { x: 0, y: 0, s: 0.36 },
  },
  galaxy: {
    draw: (t) => (
      <g transform={`rotate(${t * 15})`}>
        <ellipse rx={95} ry={58} fill="#6a35d6" opacity={0.35} />
        <path d="M0 0 C40 -10 60 -50 20 -70 M0 0 C-40 10 -60 50 -20 70 M0 0 C-10 -40 -60 -50 -80 -20 M0 0 C10 40 60 50 80 20" stroke="#cfb6ff" strokeWidth={14} fill="none" strokeLinecap="round" />
        <circle r={20} fill="#fff6c2" />
      </g>
    ),
  },
  rocket: {
    draw: (t) => (
      <g transform="rotate(35)">
        <path d={`M-18 62 Q0 ${100 + Math.sin(t * 30) * 12} 18 62Z`} fill="#ff9d2e" stroke={INK} strokeWidth={4} />
        <path d="M-30 30 L-52 64 L-24 56Z M30 30 L52 64 L24 56Z" fill="#e53950" {...st} />
        <path d="M0 -96 Q40 -50 32 50 L-32 50 Q-40 -50 0 -96Z" fill="#f4f4f4" {...st} />
        <circle cy={-20} r={18} fill="#7cc8ff" {...st} />
        <path d="M-26 -58 Q0 -66 26 -58" stroke="#e53950" strokeWidth={10} fill="none" />
      </g>
    ),
  },
  meteor: {
    draw: (t) => (
      <g>
        <path d="M30 -30 L100 -96 M10 -46 L70 -100 M44 -8 L96 -54" stroke="#ff9d2e" strokeWidth={12} strokeLinecap="round" opacity={0.8} />
        <path d="M-60 -10 Q-70 -60 -20 -60 Q30 -70 40 -20 Q60 30 10 50 Q-50 70 -60 -10Z" fill="#9b8574" {...st} transform={`rotate(${t * 30} -10 -5)`} />
      </g>
    ),
    aliases: ["asteroid", "comet"],
  },
  atom: {
    draw: (t) => (
      <g>
        {[0, 60, 120].map((r) => <ellipse key={r} rx={92} ry={32} fill="none" stroke={INK} strokeWidth={7} transform={`rotate(${r})`} />)}
        {[0, 60, 120].map((r, i) => {
          const a = t * 3 + i * 2;
          return <circle key={i} cx={Math.cos(a) * 92} cy={Math.sin(a) * 32} r={10} fill="#4f7bff" stroke={INK} strokeWidth={4} transform={`rotate(${r})`} />;
        })}
        <circle r={20} fill="#e53950" {...st} />
      </g>
    ),
  },
  dna: {
    draw: (t) => (
      <g>
        {Array.from({ length: 9 }).map((_, i) => {
          const y = -88 + i * 22;
          const x = Math.sin(i * 0.8 + t * 2) * 44;
          return (
            <g key={i}>
              <line x1={-x} y1={y} x2={x} y2={y} stroke={INK} strokeWidth={5} />
              <circle cx={-x} cy={y} r={10} fill="#4f7bff" stroke={INK} strokeWidth={4} />
              <circle cx={x} cy={y} r={10} fill="#ff6b8b" stroke={INK} strokeWidth={4} />
            </g>
          );
        })}
      </g>
    ),
  },
  flask: {
    draw: (t, o) => (
      <g>
        <path d="M-22 -86 H22 V-30 L70 64 Q76 84 56 84 H-56 Q-76 84 -70 64 L-22 -30Z" fill="#eaf8ff" {...st} />
        <path d="M-46 20 H46 L66 62 Q70 74 56 74 H-56 Q-70 74 -66 62Z" fill={o.color ?? "#5fdc8e"} />
        <circle cx={-10 + Math.sin(t * 3) * 6} cy={30 - ((t * 30) % 40)} r={7} fill="#fff" stroke={INK} strokeWidth={3} />
        <path d="M-22 -86 H22 V-30 L70 64 Q76 84 56 84 H-56 Q-76 84 -70 64 L-22 -30Z" fill="none" {...st} />
        <rect x={-30} y={-96} width={60} height={14} rx={6} fill="#fff" {...st} />
      </g>
    ),
    aliases: ["chemistry", "potion"],
  },
  magnifier: {
    draw: () => (
      <g>
        <line x1={34} y1={34} x2={90} y2={90} stroke={INK} strokeWidth={26} strokeLinecap="round" />
        <line x1={40} y1={40} x2={86} y2={86} stroke="#8d5a3b" strokeWidth={14} strokeLinecap="round" />
        <circle cx={-14} cy={-14} r={64} fill="#bfe8ff" {...st} strokeWidth={10} />
        <path d="M-50 -30 Q-44 -50 -24 -56" stroke="#fff" strokeWidth={10} fill="none" strokeLinecap="round" />
      </g>
    ),
    aliases: ["search", "magnifying_glass"],
  },
  microscope: {
    draw: () => (
      <g {...st}>
        <rect x={-74} y={70} width={148} height={20} rx={8} fill="#4f7bff" />
        <path d="M36 70 V0 Q36 -40 4 -52" fill="none" stroke={INK} strokeWidth={18} />
        <path d="M36 70 V0 Q36 -40 4 -52" fill="none" stroke="#90a4ae" strokeWidth={8} />
        <rect x={-64} y={22} width={84} height={12} rx={4} fill="#cfd8dc" />
        <g transform="rotate(-22 -14 -40)">
          <rect x={-32} y={-96} width={36} height={96} rx={8} fill="#e8eef5" />
          <rect x={-38} y={-108} width={48} height={18} rx={5} fill="#30343f" />
          <rect x={-24} y={0} width={20} height={16} rx={3} fill="#30343f" />
        </g>
      </g>
    ),
  },
  lightbulb: {
    draw: (_t, o) => (
      <g>
        {o.glow && <circle cy={-14} r={96} fill="#fff59d" opacity={0.6} />}
        <path d="M-30 40 Q-34 20 -48 2 Q-72 -30 -50 -62 Q-28 -92 0 -92 Q28 -92 50 -62 Q72 -30 48 2 Q34 20 30 40Z" fill="#ffe14d" {...st} />
        <rect x={-30} y={40} width={60} height={34} rx={6} fill="#c7cdd4" {...st} />
        <path d="M-30 52 H30 M-30 62 H30" stroke={INK} strokeWidth={4} />
        <path d="M-12 74 Q0 92 12 74" fill={INK} />
        <path d="M-16 20 L-8 -20 L0 0 L8 -20 L16 20" stroke="#ff9d2e" strokeWidth={6} fill="none" strokeLinejoin="round" />
      </g>
    ),
    face: { x: 0, y: -36, s: 0.38 },
    aliases: ["idea", "bulb"],
  },
  brain: {
    draw: () => (
      <g>
        <path d="M-10 -80 Q-60 -90 -78 -50 Q-104 -36 -90 0 Q-104 34 -70 54 Q-56 84 -16 74 Q0 86 16 74 Q56 84 70 54 Q104 34 90 0 Q104 -36 78 -50 Q60 -90 10 -80 Q0 -86 -10 -80Z" fill="#ff9fb8" {...st} />
        <path d="M0 -78 V72 M-60 -40 Q-30 -30 -40 0 Q-50 30 -20 40 M60 -40 Q30 -30 40 0 Q50 30 20 40" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
      </g>
    ),
    face: { x: 0, y: 6, s: 0.42 },
  },
  heart: {
    draw: (t, o) => {
      const b = 1 + Math.max(0, Math.sin(t * 7)) * 0.06;
      return <path transform={`scale(${b * 4.2})`} d="M0 18 C-26 0 -20 -20 -8 -20 C-3 -20 0 -15 0 -11 C0 -15 3 -20 8 -20 C20 -20 26 0 0 18Z" fill={o.color ?? "#ff4d6d"} stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />;
    },
    face: { x: 0, y: -8, s: 0.4 },
  },
  book: {
    draw: (_t, o) => (
      <g>
        <path d="M-90 -60 Q-45 -78 0 -58 Q45 -78 90 -60 V70 Q45 52 0 72 Q-45 52 -90 70Z" fill="#fffaf0" {...st} />
        <path d="M0 -58 V72" stroke={INK} strokeWidth={5} />
        <path d="M-74 -36 Q-40 -48 -14 -36 M-74 -12 Q-40 -24 -14 -12 M-74 12 Q-40 0 -14 12 M14 -36 Q40 -48 74 -36 M14 -12 Q40 -24 74 -12" stroke="#9aa5b1" strokeWidth={5} fill="none" />
        <path d="M-96 -54 V78 Q-48 60 0 82 Q48 60 96 78 V-54" fill="none" stroke={o.color ?? "#e53950"} strokeWidth={9} strokeLinejoin="round" />
      </g>
    ),
    aliases: ["books", "story", "history_book"],
  },
  closedbook: {
    draw: (_t, o) => (
      <g {...st}>
        <rect x={-64} y={-84} width={128} height={168} rx={10} fill={o.color ?? "#e53950"} />
        <rect x={-50} y={-84} width={14} height={168} fill="#00000022" stroke="none" />
        <rect x={-30} y={-50} width={70} height={30} rx={4} fill="#ffd23f" />
      </g>
    ),
    face: { x: 6, y: 20, s: 0.42 },
  },
  scroll: {
    draw: () => (
      <g {...st}>
        <rect x={-66} y={-70} width={132} height={140} fill="#f6e7c1" />
        <path d="M-66 -70 h132" />
        <rect x={-84} y={-88} width={168} height={26} rx={13} fill="#d9b77e" />
        <rect x={-84} y={62} width={168} height={26} rx={13} fill="#d9b77e" />
        <path d="M-46 -36 H46 M-46 -12 H40 M-46 12 H46 M-46 36 H20" stroke="#8d6e63" strokeWidth={6} />
      </g>
    ),
    aliases: ["parchment", "tablet_scroll"],
  },
  tablet: {
    draw: () => (
      <g {...st}>
        <path d="M-70 -90 Q0 -100 70 -90 L76 90 Q0 100 -76 90Z" fill="#c98d63" />
        {[-60, -30, 0, 30, 60].map((y) => <path key={y} d={`M-50 ${y} l8 -8 l4 10 l10 -6 M-10 ${y} l8 -8 l4 10 M24 ${y} l10 -6 l4 10`} stroke="#6d4129" strokeWidth={4} fill="none" />)}
      </g>
    ),
    aliases: ["clay_tablet", "cuneiform"],
  },
  letter: {
    draw: () => (
      <g {...st}>
        <rect x={-90} y={-58} width={180} height={116} rx={8} fill="#fffaf0" />
        <path d="M-90 -58 L0 12 L90 -58" fill="none" />
        <circle cx={0} cy={12} r={14} fill="#e53950" />
      </g>
    ),
    aliases: ["envelope", "message", "mail"],
  },
  newspaper: {
    draw: () => (
      <g {...st}>
        <rect x={-80} y={-92} width={160} height={184} rx={4} fill="#fafafa" />
        <rect x={-64} y={-76} width={128} height={26} fill="#30343f" />
        <rect x={-64} y={-38} width={60} height={50} fill="#cfd8dc" />
        <path d="M8 -36 H64 M8 -20 H64 M8 -4 H64 M-64 30 H64 M-64 46 H64 M-64 62 H40" stroke="#90a4ae" strokeWidth={5} />
      </g>
    ),
    aliases: ["news"],
  },
  coin: {
    draw: (t, o) => {
      const sx = Math.abs(Math.cos(t * 2.2)) * 0.25 + 0.75;
      return (
        <g transform={`scale(${sx} 1)`}>
          <circle r={84} fill={o.color ?? "#ffc21a"} {...st} />
          <circle r={62} fill="none" stroke="#e09a00" strokeWidth={8} />
          <text y={30} textAnchor="middle" fontSize={84} fontWeight={900} fill="#e09a00" fontFamily="Arial Black, Arial">$</text>
        </g>
      );
    },
    face: { x: 0, y: 0, s: 0.5 },
    aliases: ["gold", "dinar"],
  },
  coins: {
    draw: () => (
      <g {...st}>
        {[60, 40, 20, 0, -20].map((y, i) => <ellipse key={i} cx={-30} cy={y} rx={50} ry={16} fill="#ffc21a" />)}
        {[60, 40, 20].map((y, i) => <ellipse key={i} cx={46} cy={y} rx={50} ry={16} fill="#ffc21a" />)}
      </g>
    ),
    aliases: ["money_stack", "wealth"],
  },
  money: {
    draw: () => (
      <g {...st}>
        <rect x={-96} y={-50} width={192} height={100} rx={8} fill="#7fd48b" />
        <circle r={30} fill="#b9ecbf" />
        <text y={16} textAnchor="middle" fontSize={44} fontWeight={900} fill="#2e7d32" stroke="none" fontFamily="Arial Black, Arial">$</text>
        <circle cx={-70} cy={-28} r={8} fill="#2e7d32" stroke="none" />
        <circle cx={70} cy={28} r={8} fill="#2e7d32" stroke="none" />
      </g>
    ),
    aliases: ["cash", "dollar", "bill"],
  },
  moneybag: {
    draw: () => (
      <g {...st}>
        <path d="M-30 -60 Q-40 -86 -16 -90 L16 -90 Q40 -86 30 -60Z" fill="#c8a26b" />
        <path d="M-30 -60 Q-96 0 -80 60 Q-70 92 0 92 Q70 92 80 60 Q96 0 30 -60Z" fill="#d9b77e" />
        <path d="M-34 -60 H34" strokeWidth={10} />
        <text y={46} textAnchor="middle" fontSize={80} fontWeight={900} fill="#7a5a2f" stroke="none" fontFamily="Arial Black, Arial">$</text>
      </g>
    ),
    face: { x: 0, y: 22, s: 0.4 },
    aliases: ["bag", "treasure", "profit"],
  },
  chart: {
    draw: (t) => {
      const g = Math.min(1, t / 1.2);
      return (
        <g {...st}>
          <path d="M-90 -90 V86 H90" fill="none" strokeWidth={8} />
          {[30, 60, 100, 150].map((h, i) => <rect key={i} x={-74 + i * 40} y={80 - h * g} width={28} height={h * g} fill={["#ff6b8b", "#ffc83d", "#3ddc97", "#4f7bff"][i]} />)}
          <path d={`M-70 40 L-30 10 L10 -20 L60 -80`} fill="none" stroke="#e53950" strokeWidth={8} strokeDasharray="300" strokeDashoffset={300 * (1 - g)} />
        </g>
      );
    },
    aliases: ["graph", "growth", "statistics", "data"],
  },
  chart_down: {
    draw: () => (
      <g {...st}>
        <path d="M-90 -90 V86 H90" fill="none" strokeWidth={8} />
        <path d="M-70 -60 L-30 -20 L0 -34 L60 50" fill="none" stroke="#e53950" strokeWidth={10} />
        <path d="M60 50 L30 46 M60 50 L58 20" stroke="#e53950" strokeWidth={10} />
      </g>
    ),
    aliases: ["loss", "decline", "crash"],
  },
  clock: {
    draw: (t) => (
      <g>
        <circle r={86} fill="#fff" {...st} strokeWidth={9} />
        {Array.from({ length: 12 }).map((_, i) => <line key={i} x1={0} y1={-70} x2={0} y2={-60} stroke={INK} strokeWidth={5} transform={`rotate(${i * 30})`} />)}
        <line x1={0} y1={0} x2={0} y2={-56} stroke={INK} strokeWidth={8} strokeLinecap="round" transform={`rotate(${t * 120})`} />
        <line x1={0} y1={0} x2={0} y2={-36} stroke="#e53950" strokeWidth={9} strokeLinecap="round" transform={`rotate(${t * 10})`} />
        <circle r={8} fill={INK} />
      </g>
    ),
    aliases: ["time", "watch"],
  },
  hourglass: {
    draw: (t) => {
      const p = (t * 0.2) % 1;
      return (
        <g {...st}>
          <rect x={-70} y={-96} width={140} height={16} rx={6} fill="#8d5a3b" />
          <rect x={-70} y={80} width={140} height={16} rx={6} fill="#8d5a3b" />
          <path d="M-54 -80 H54 Q50 -20 6 0 Q50 20 54 80 H-54 Q-50 20 -6 0 Q-50 -20 -54 -80Z" fill="#eaf8ff" />
          <path d={`M${-40 * (1 - p)} ${-60 + p * 50} H${40 * (1 - p)} L0 -2Z`} fill="#ffc83d" stroke="none" />
          <path d={`M-44 76 L0 ${76 - p * 46} L44 76Z`} fill="#ffc83d" stroke="none" />
        </g>
      );
    },
    aliases: ["sand_timer", "waiting"],
  },
  calendar: {
    draw: () => (
      <g {...st}>
        <rect x={-80} y={-70} width={160} height={150} rx={12} fill="#fff" />
        <path d="M-80 -30 H80 V-58 Q80 -70 68 -70 H-68 Q-80 -70 -80 -58Z" fill="#e53950" />
        <rect x={-50} y={-90} width={14} height={34} rx={6} fill="#cfd8dc" />
        <rect x={36} y={-90} width={14} height={34} rx={6} fill="#cfd8dc" />
        {[0, 1, 2, 3].map((c) => [0, 1, 2].map((r) => <rect key={`${c}${r}`} x={-62 + c * 32} y={-14 + r * 30} width={20} height={18} rx={3} fill="#cfd8dc" stroke="none" />))}
      </g>
    ),
    aliases: ["date", "year", "day"],
  },
  phone: {
    draw: () => (
      <g {...st}>
        <rect x={-52} y={-92} width={104} height={184} rx={18} fill="#30343f" />
        <rect x={-42} y={-74} width={84} height={140} rx={6} fill="#7cc8ff" />
        <circle cy={78} r={7} fill="#90a4ae" stroke="none" />
      </g>
    ),
    face: { x: 0, y: -6, s: 0.36 },
    aliases: ["smartphone", "mobile"],
  },
  laptop: {
    draw: () => (
      <g {...st}>
        <rect x={-80} y={-76} width={160} height={110} rx={10} fill="#30343f" />
        <rect x={-68} y={-64} width={136} height={86} rx={4} fill="#7cc8ff" />
        <path d="M-100 40 H100 L88 64 H-88Z" fill="#cfd8dc" />
        <path d="M-56 -44 H-10 M-56 -26 H20 M-56 -8 H0" stroke="#30343f" strokeWidth={6} />
      </g>
    ),
    face: { x: 0, y: -22, s: 0.34 },
    aliases: ["computer", "code", "programming", "internet"],
  },
  gamepad: {
    draw: () => (
      <g {...st}>
        <path d="M-60 -40 H60 Q96 -40 98 10 Q100 60 70 60 Q50 60 36 30 H-36 Q-50 60 -70 60 Q-100 60 -98 10 Q-96 -40 -60 -40Z" fill="#6a35d6" />
        <path d="M-60 -6 H-30 M-45 -21 V9" stroke="#fff" strokeWidth={10} />
        <circle cx={44} cy={-12} r={9} fill="#ffc83d" strokeWidth={4} />
        <circle cx={64} cy={6} r={9} fill="#3ddc97" strokeWidth={4} />
      </g>
    ),
    aliases: ["game", "controller", "video_game"],
  },
  robot: {
    draw: (t) => (
      <g {...st}>
        <line x1={0} y1={-70} x2={0} y2={-94} />
        <circle cy={-96} r={9} fill={Math.sin(t * 6) > 0 ? "#e53950" : "#ffc83d"} />
        <rect x={-70} y={-70} width={140} height={120} rx={22} fill="#b0bec5" />
        <rect x={-50} y={-48} width={100} height={70} rx={14} fill="#eceff1" />
        <rect x={-90} y={-20} width={20} height={44} rx={8} fill="#90a4ae" />
        <rect x={70} y={-20} width={20} height={44} rx={8} fill="#90a4ae" />
        <rect x={-40} y={50} width={80} height={30} rx={8} fill="#90a4ae" />
      </g>
    ),
    face: { x: 0, y: -12, s: 0.36 },
    aliases: ["ai", "artificial_intelligence", "machine"],
  },
  gear: {
    draw: (t, o) => (
      <g transform={`rotate(${t * 40})`}>
        <polygon points={spiky(92, 70, 10)} fill={o.color ?? "#90a4ae"} {...st} />
        <circle r={56} fill={o.color ?? "#90a4ae"} stroke="none" />
        <circle r={24} fill="#eceff1" {...st} />
      </g>
    ),
    aliases: ["settings", "engine", "mechanism", "industry"],
  },
  key: {
    draw: () => (
      <g {...st} transform="rotate(-35)">
        <circle cx={-50} r={36} fill="#ffc21a" />
        <circle cx={-50} r={12} fill="#fff" />
        <path d="M-14 -10 H90 V10 H70 V30 H52 V10 H-14Z" fill="#ffc21a" />
      </g>
    ),
    aliases: ["solution", "secret"],
  },
  lock: {
    draw: () => (
      <g {...st}>
        <path d="M-44 -10 V-44 Q-44 -90 0 -90 Q44 -90 44 -44 V-10" fill="none" strokeWidth={18} />
        <path d="M-44 -10 V-44 Q-44 -90 0 -90 Q44 -90 44 -44 V-10" fill="none" stroke="#b0bec5" strokeWidth={8} />
        <rect x={-66} y={-12} width={132} height={104} rx={14} fill="#ffc21a" />
        <circle cy={30} r={12} fill={INK} />
        <rect x={-4} y={30} width={8} height={30} fill={INK} />
      </g>
    ),
    aliases: ["security", "encryption", "cipher", "password"],
  },
  crown: {
    draw: () => (
      <g {...st}>
        <path d="M-80 40 L-90 -60 L-40 -10 L0 -80 L40 -10 L90 -60 L80 40Z" fill="#ffc21a" />
        <rect x={-82} y={40} width={164} height={28} rx={6} fill="#ffb300" />
        <circle cy={-14} r={12} fill="#e53950" strokeWidth={4} />
      </g>
    ),
    aliases: ["king", "queen", "royal", "empire"],
  },
  sword: {
    draw: () => (
      <g {...st} transform="rotate(40)">
        <path d="M-10 -96 L10 -96 L12 30 L-12 30Z" fill="#e8eef5" />
        <path d="M0 -96 V30" stroke="#b0bec5" strokeWidth={4} />
        <rect x={-46} y={30} width={92} height={16} rx={6} fill="#ffc21a" />
        <rect x={-9} y={46} width={18} height={40} rx={4} fill="#8d5a3b" />
        <circle cy={92} r={10} fill="#ffc21a" />
      </g>
    ),
    aliases: ["war", "battle", "fight", "weapon"],
  },
  shield: {
    draw: (_t, o) => (
      <g {...st}>
        <path d="M0 -92 Q50 -70 84 -70 Q84 40 0 94 Q-84 40 -84 -70 Q-50 -70 0 -92Z" fill={o.color ?? "#4f7bff"} />
        <path d="M0 -70 Q36 -54 62 -54 Q62 30 0 70 Q-62 30 -62 -54 Q-36 -54 0 -70Z" fill="none" stroke="#fff" strokeWidth={8} />
      </g>
    ),
    face: { x: 0, y: -4, s: 0.42 },
    aliases: ["defense", "protection", "safety"],
  },
  flag: {
    draw: (t, o) => {
      const w = Math.sin(t * 5) * 8;
      return (
        <g {...st}>
          <line x1={-60} y1={-90} x2={-60} y2={96} strokeWidth={9} />
          <path d={`M-60 -86 Q-10 ${-100 + w} 30 -86 Q60 ${-74 - w} 90 -84 V-10 Q60 ${0 - w} 30 -12 Q-10 ${-26 + w} -60 -12Z`} fill={o.color ?? "#e53950"} />
        </g>
      );
    },
    aliases: ["country", "nation", "victory_flag"],
  },
  trophy: {
    draw: () => (
      <g {...st}>
        <path d="M-50 -80 H50 V-30 Q50 30 0 36 Q-50 30 -50 -30Z" fill="#ffc21a" />
        <path d="M-50 -60 Q-90 -60 -84 -26 Q-78 4 -44 4 M50 -60 Q90 -60 84 -26 Q78 4 44 4" fill="none" strokeWidth={9} />
        <rect x={-12} y={36} width={24} height={30} fill="#ffb300" />
        <rect x={-46} y={66} width={92} height={22} rx={6} fill="#8d5a3b" />
      </g>
    ),
    face: { x: 0, y: -28, s: 0.34 },
    aliases: ["win", "winner", "award", "success", "champion"],
  },
  gift: {
    draw: () => (
      <g {...st}>
        <rect x={-76} y={-30} width={152} height={110} rx={6} fill="#e53950" />
        <rect x={-86} y={-56} width={172} height={32} rx={6} fill="#ff6b8b" />
        <rect x={-14} y={-56} width={28} height={136} fill="#ffd23f" />
        <path d="M0 -56 Q-60 -110 -40 -60 M0 -56 Q60 -110 40 -60" fill="none" stroke="#ffd23f" strokeWidth={12} />
      </g>
    ),
    aliases: ["present", "reward", "bonus"],
  },
  house: {
    draw: () => (
      <g {...st}>
        <rect x={-70} y={-20} width={140} height={100} fill="#fff1d6" />
        <path d="M-92 -14 L0 -92 L92 -14Z" fill="#e53950" />
        <rect x={-22} y={20} width={44} height={60} rx={4} fill="#8d5a3b" />
        <rect x={34} y={6} width={26} height={26} fill="#7cc8ff" strokeWidth={4} />
      </g>
    ),
    face: { x: -34, y: 30, s: 0.22 },
    aliases: ["home", "building"],
  },
  castle: {
    draw: () => (
      <g {...st}>
        <rect x={-80} y={-30} width={160} height={116} fill="#cfd8dc" />
        <path d="M-80 -30 V-60 H-60 V-44 H-40 V-60 H-20 V-44 H0 V-60 H20 V-44 H40 V-60 H60 V-44 H80 V-30" fill="#cfd8dc" />
        <path d="M-22 86 V40 Q0 18 22 40 V86" fill="#8d5a3b" />
        <rect x={-58} y={0} width={20} height={26} rx={8} fill={INK} />
        <rect x={38} y={0} width={20} height={26} rx={8} fill={INK} />
      </g>
    ),
    aliases: ["fortress", "palace", "kingdom"],
  },
  pyramid: {
    draw: () => (
      <g {...st}>
        <path d="M-96 80 L0 -84 L96 80Z" fill="#f2c46d" />
        <path d="M0 -84 L30 80" stroke={INK} strokeWidth={4} />
        <path d="M-70 36 H62 M-44 -8 H36 M-20 -48 H14" stroke="#c49a46" strokeWidth={5} />
      </g>
    ),
    aliases: ["egypt", "pharaoh_tomb", "ancient"],
  },
  ziggurat: {
    draw: () => (
      <g {...st}>
        <rect x={-96} y={40} width={192} height={40} fill="#d9a066" />
        <rect x={-70} y={0} width={140} height={40} fill="#e3b07a" />
        <rect x={-44} y={-40} width={88} height={40} fill="#ecc08e" />
        <rect x={-20} y={-72} width={40} height={32} fill="#f2cfa2" />
        <path d="M-10 80 V0 H10 V80" fill="#c98d63" />
      </g>
    ),
    aliases: ["mesopotamia", "sumer", "babylon", "temple", "uruk"],
  },
  tree: {
    draw: (t) => (
      <g {...st}>
        <path d="M-14 90 L-10 10 L10 10 L14 90Z" fill="#8d5a3b" />
        <g transform={`rotate(${Math.sin(t * 1.5) * 2} 0 10)`}>
          <circle cx={-40} cy={-20} r={44} fill="#5fcf73" />
          <circle cx={40} cy={-20} r={44} fill="#5fcf73" />
          <circle cx={0} cy={-56} r={50} fill="#5fcf73" />
          <circle cx={0} cy={-10} r={40} fill="#5fcf73" stroke="none" />
        </g>
      </g>
    ),
    face: { x: 0, y: -36, s: 0.36 },
    aliases: ["forest", "nature", "plant"],
  },
  palm: {
    draw: () => (
      <g {...st}>
        <path d="M-6 92 Q-18 20 6 -50 L18 -50 Q0 20 10 92Z" fill="#a1754f" />
        {[-150, -110, -60, -20, 20].map((a, i) => <path key={i} d="M12 -52 Q50 -90 96 -60 Q50 -70 12 -52Z" fill="#4caf50" transform={`rotate(${a + 90} 12 -52)`} />)}
      </g>
    ),
    aliases: ["palm_tree", "oasis", "desert_tree"],
  },
  mountain: {
    draw: () => (
      <g {...st}>
        <path d="M-100 80 L-30 -60 L10 10 L40 -30 L100 80Z" fill="#9aa5b1" />
        <path d="M-30 -60 L-50 -20 L-36 -26 L-22 -14 L-14 -28Z" fill="#fff" />
      </g>
    ),
    aliases: ["mountains", "hill"],
  },
  volcano: {
    draw: (t) => (
      <g {...st}>
        <circle cx={-10} cy={-80 - ((t * 20) % 20)} r={20} fill="#9e9e9e" opacity={0.8} />
        <circle cx={20} cy={-100 - ((t * 20) % 20)} r={26} fill="#bdbdbd" opacity={0.8} />
        <path d="M-100 84 L-30 -40 H30 L100 84Z" fill="#8d6e63" />
        <path d="M-30 -40 Q-20 0 -36 30 Q-10 10 0 40 Q10 0 30 20 Q20 -10 30 -40Z" fill="#ff5722" />
      </g>
    ),
    aliases: ["eruption", "lava"],
  },
  cloud: {
    draw: (t, o) => (
      <g transform={`translate(${Math.sin(t) * 4} 0)`}>
        <path d="M-70 40 Q-100 40 -96 10 Q-94 -20 -62 -18 Q-60 -60 -18 -60 Q16 -78 40 -46 Q80 -60 90 -20 Q110 10 84 40Z" fill={o.color ?? "#fff"} {...st} />
      </g>
    ),
    face: { x: 0, y: 0, s: 0.36 },
  },
  rain: {
    draw: (t) => (
      <g>
        {[-50, -10, 30, 70].map((x, i) => {
          const y = ((t * 160 + i * 30) % 80);
          return <line key={i} x1={x - 6} y1={10 + y} x2={x - 12} y2={28 + y} stroke="#3f7ff0" strokeWidth={7} strokeLinecap="round" />;
        })}
        <path d="M-70 10 Q-100 10 -96 -20 Q-94 -50 -62 -48 Q-60 -90 -18 -90 Q16 -108 40 -76 Q80 -90 90 -50 Q110 -20 84 10Z" fill="#b0bec5" {...st} />
      </g>
    ),
    aliases: ["storm", "weather"],
  },
  lightning: {
    draw: () => <path d="M20 -96 L-50 10 H-6 L-30 96 L56 -14 H10 L40 -96Z" fill="#ffd23f" {...st} />,
    aliases: ["electricity", "energy", "power", "bolt"],
  },
  fire: {
    draw: (t) => {
      const f = Math.sin(t * 12) * 6;
      return (
        <g {...st}>
          <path d={`M0 90 Q-80 80 -66 10 Q-56 -30 -20 -60 Q-26 -20 0 -10 Q-10 -60 30 ${-96 + f} Q30 -40 60 -20 Q90 30 60 70 Q40 92 0 90Z`} fill="#ff7a2f" />
          <path d={`M0 84 Q-40 78 -36 40 Q-30 10 -6 -6 Q0 20 16 24 Q20 0 30 ${-14 - f} Q56 30 40 60 Q26 84 0 84Z`} fill="#ffd23f" />
        </g>
      );
    },
    face: { x: 0, y: 36, s: 0.3 },
    aliases: ["flame", "heat", "hot", "burn"],
  },
  water: {
    draw: () => <path d="M0 -92 Q70 0 66 36 Q60 90 0 90 Q-60 90 -66 36 Q-70 0 0 -92Z" fill="#4fb3ff" {...st} />,
    face: { x: 0, y: 30, s: 0.38 },
    aliases: ["drop", "droplet", "liquid"],
  },
  wave: {
    draw: (t) => (
      <g {...st}>
        <path d={`M-100 90 V0 Q-70 ${-40 + Math.sin(t * 3) * 8} -40 0 Q-10 ${40} 20 0 Q50 ${-40 + Math.sin(t * 3) * 8} 80 0 Q90 -10 100 0 V90Z`} fill="#3f7ff0" />
        <path d="M-90 20 Q-70 0 -50 20 M10 20 Q30 0 50 20" stroke="#fff" strokeWidth={6} fill="none" />
      </g>
    ),
    aliases: ["sea", "ocean", "water_wave"],
  },
  snowflake: {
    draw: (t) => (
      <g transform={`rotate(${t * 20})`} stroke={INK} strokeWidth={14} strokeLinecap="round">
        {[0, 60, 120].map((a) => <line key={a} x1={0} y1={-86} x2={0} y2={86} transform={`rotate(${a})`} />)}
        <g stroke="#bfe8ff" strokeWidth={6}>{[0, 60, 120].map((a) => <line key={a} x1={0} y1={-86} x2={0} y2={86} transform={`rotate(${a})`} />)}</g>
      </g>
    ),
    aliases: ["snow", "cold", "ice", "winter"],
  },
  rock: {
    draw: (_t, o) => <path d="M-80 50 Q-96 0 -60 -40 Q-30 -76 20 -66 Q70 -60 88 -10 Q100 40 60 66 Q0 84 -80 50Z" fill={o.color ?? "#9e9e9e"} {...st} />,
    face: { x: 0, y: 0, s: 0.42 },
    aliases: ["stone", "boulder"],
  },
  gem: {
    draw: (_t, o) => (
      <g {...st}>
        <path d="M-80 -30 L-40 -76 H40 L80 -30 L0 86Z" fill={o.color ?? "#4fd1ff"} />
        <path d="M-80 -30 H80 M-40 -76 L-20 -30 L0 86 L20 -30 L40 -76" fill="none" strokeWidth={4} />
      </g>
    ),
    aliases: ["diamond", "jewel", "crystal", "treasure_gem"],
  },
  camera: {
    draw: () => (
      <g {...st}>
        <rect x={-90} y={-50} width={180} height={120} rx={16} fill="#30343f" />
        <rect x={-40} y={-74} width={80} height={30} rx={6} fill="#30343f" />
        <circle cy={10} r={42} fill="#7cc8ff" strokeWidth={9} />
        <circle cx={60} cy={-28} r={8} fill="#e53950" stroke="none" />
      </g>
    ),
    aliases: ["photo", "video", "film"],
  },
  music: {
    draw: () => (
      <g {...st}>
        <path d="M-30 50 V-70 L70 -90 V30" fill="none" strokeWidth={10} />
        <ellipse cx={-50} cy={54} rx={26} ry={20} fill={INK} />
        <ellipse cx={50} cy={34} rx={26} ry={20} fill={INK} />
      </g>
    ),
    aliases: ["song", "note", "sound"],
  },
  question: {
    draw: (_t, o) => <text y={70} textAnchor="middle" fontSize={210} fontWeight={900} fill={o.color ?? "#4f7bff"} stroke={INK} strokeWidth={9} paintOrder="stroke" fontFamily="Arial Black, Arial">?</text>,
    aliases: ["why", "how", "mystery"],
  },
  exclamation: {
    draw: (_t, o) => <text y={70} textAnchor="middle" fontSize={210} fontWeight={900} fill={o.color ?? "#e53950"} stroke={INK} strokeWidth={9} paintOrder="stroke" fontFamily="Arial Black, Arial">!</text>,
    aliases: ["alert", "attention", "important"],
  },
  check: {
    draw: () => (
      <g>
        <circle r={86} fill="#3ddc97" {...st} />
        <path d="M-44 4 L-12 36 L48 -30" stroke={INK} strokeWidth={22} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M-44 4 L-12 36 L48 -30" stroke="#fff" strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    ),
    aliases: ["yes", "correct", "done", "right"],
  },
  cross: {
    draw: () => (
      <g>
        <circle r={86} fill="#e53950" {...st} />
        <path d="M-36 -36 L36 36 M36 -36 L-36 36" stroke="#fff" strokeWidth={18} strokeLinecap="round" />
      </g>
    ),
    aliases: ["no", "wrong", "false", "x"],
  },
  warning: {
    draw: () => (
      <g {...st}>
        <path d="M0 -88 L92 76 H-92Z" fill="#ffd23f" />
        <path d="M0 -30 V22" strokeWidth={16} />
        <circle cy={50} r={9} fill={INK} />
      </g>
    ),
    aliases: ["danger", "caution", "risk"],
  },
  globe: {
    draw: (t) => (
      <g {...st}>
        <path d="M-40 92 H40 M0 70 V92" strokeWidth={9} />
        <path d="M-76 -10 A80 80 0 0 0 60 60" fill="none" strokeWidth={8} stroke="#8d5a3b" />
        <circle cy={-10} r={64} fill="#3b8df0" />
        <g transform={`translate(${Math.sin(t) * 10} -10)`}>
          <path d="M-40 -30 Q-10 -50 6 -26 Q-10 0 -30 6 Q-50 -10 -40 -30Z M14 10 Q40 0 44 30 Q20 44 14 10Z" fill="#4ccf6a" strokeWidth={4} />
        </g>
      </g>
    ),
    aliases: ["geography", "travel", "map_globe"],
  },
  map: {
    draw: () => (
      <g {...st}>
        <path d="M-90 -60 L-30 -80 L30 -60 L90 -80 V60 L30 80 L-30 60 L-90 80Z" fill="#f6e7c1" />
        <path d="M-30 -80 V60 M30 -60 V80" strokeWidth={4} />
        <path d="M-60 30 Q-20 -40 50 -20" stroke="#e53950" strokeWidth={6} strokeDasharray="10 10" fill="none" />
        <path d="M44 -36 L60 -14 M60 -36 L44 -14" stroke="#e53950" strokeWidth={8} />
      </g>
    ),
    aliases: ["route", "journey", "treasure_map"],
  },
  compass: {
    draw: (t) => (
      <g {...st}>
        <circle r={86} fill="#fff" strokeWidth={9} />
        <g transform={`rotate(${Math.sin(t * 2) * 25})`}>
          <path d="M0 -66 L16 0 L-16 0Z" fill="#e53950" strokeWidth={4} />
          <path d="M0 66 L16 0 L-16 0Z" fill="#cfd8dc" strokeWidth={4} />
        </g>
      </g>
    ),
    aliases: ["direction", "navigation", "explore"],
  },
  apple: {
    draw: () => (
      <g {...st}>
        <path d="M0 -50 Q-30 -70 -60 -50 Q-96 -20 -76 34 Q-56 90 -20 84 Q0 76 20 84 Q56 90 76 34 Q96 -20 60 -50 Q30 -70 0 -50Z" fill="#e53950" />
        <path d="M0 -50 Q4 -76 18 -90" fill="none" strokeWidth={8} />
        <path d="M10 -70 Q40 -96 56 -70 Q30 -56 10 -70Z" fill="#5fcf73" strokeWidth={4} />
      </g>
    ),
    face: { x: 0, y: 14, s: 0.4 },
    aliases: ["fruit", "food"],
  },
  bomb: {
    draw: (t) => (
      <g {...st}>
        <circle cy={14} r={70} fill="#30343f" />
        <rect x={-18} y={-74} width={36} height={24} rx={4} fill="#90a4ae" />
        <path d="M0 -74 Q20 -100 50 -90" fill="none" strokeWidth={6} />
        <polygon points={spiky(18, 8, 6, 3, t)} transform="translate(54 -92)" fill="#ffd23f" strokeWidth={3} />
      </g>
    ),
    face: { x: 0, y: 20, s: 0.4 },
    aliases: ["explosive", "explosion_bomb"],
  },
  magnet: {
    draw: () => (
      <g {...st}>
        <path d="M-70 -60 V10 Q-70 80 0 80 Q70 80 70 10 V-60 H34 V10 Q34 42 0 42 Q-34 42 -34 10 V-60Z" fill="#e53950" />
        <rect x={-70} y={-86} width={36} height={26} fill="#cfd8dc" />
        <rect x={34} y={-86} width={36} height={26} fill="#cfd8dc" />
      </g>
    ),
    aliases: ["attraction", "magnetic", "gravity"],
  },
  battery: {
    draw: (t) => (
      <g {...st}>
        <rect x={-86} y={-44} width={160} height={88} rx={12} fill="#fff" />
        <rect x={74} y={-18} width={16} height={36} rx={4} fill={INK} />
        <rect x={-74} y={-32} width={136 * (0.3 + 0.7 * ((Math.sin(t) + 1) / 2))} height={64} rx={6} fill="#3ddc97" stroke="none" />
      </g>
    ),
    aliases: ["charge"],
  },
  car: {
    draw: (t) => (
      <g {...st}>
        <path d="M-96 30 V0 Q-90 -14 -70 -16 L-40 -54 H40 L66 -16 Q94 -12 96 10 V30Z" fill="#e53950" />
        <path d="M-32 -44 H-4 V-16 H-56Z M8 -44 H32 L52 -16 H8Z" fill="#bfe8ff" strokeWidth={4} />
        {[-56, 56].map((x) => <g key={x} transform={`translate(${x} 34) rotate(${t * 400})`}><circle r={22} fill="#30343f" /><line x1={-12} x2={12} stroke="#90a4ae" strokeWidth={5} /></g>)}
      </g>
    ),
    aliases: ["vehicle", "drive", "traffic"],
  },
  ship: {
    draw: (t) => (
      <g {...st} transform={`rotate(${Math.sin(t * 2) * 4})`}>
        <path d="M-96 20 H96 L70 70 H-70Z" fill="#8d5a3b" />
        <line x1={0} y1={20} x2={0} y2={-92} strokeWidth={8} />
        <path d="M6 -86 Q70 -40 6 6Z" fill="#fff" />
        <path d="M-6 -70 Q-56 -30 -6 6Z" fill="#fff" />
      </g>
    ),
    aliases: ["boat", "sail", "navy"],
  },
  plane: {
    draw: () => (
      <g {...st} transform="rotate(-15)">
        <path d="M-96 0 Q-90 -16 -60 -16 H70 Q100 -10 100 0 Q100 10 70 16 H-60 Q-90 16 -96 0Z" fill="#eceff1" />
        <path d="M-10 -14 L-40 -80 H-14 L30 -14Z M-10 14 L-40 80 H-14 L30 14Z M-70 -14 L-86 -50 H-70 L-50 -14Z" fill="#4f7bff" />
      </g>
    ),
    aliases: ["airplane", "flight", "fly"],
  },
  skull: {
    draw: () => (
      <g {...st}>
        <path d="M-70 -10 Q-76 -90 0 -90 Q76 -90 70 -10 Q70 30 44 40 V70 H-44 V40 Q-70 30 -70 -10Z" fill="#f4f1ea" />
        <circle cx={-30} cy={-14} r={20} fill={INK} />
        <circle cx={30} cy={-14} r={20} fill={INK} />
        <path d="M-20 70 V50 M0 70 V50 M20 70 V50" strokeWidth={5} />
      </g>
    ),
    aliases: ["death", "dead", "poison"],
  },
  ghost: {
    draw: (t) => (
      <g transform={`translate(0 ${Math.sin(t * 3) * 6})`} {...st}>
        <path d="M-70 80 V-20 Q-70 -92 0 -92 Q70 -92 70 -20 V80 L46 62 L24 80 L0 62 L-24 80 L-46 62Z" fill="#fff" />
      </g>
    ),
    face: { x: 0, y: -20, s: 0.42 },
    aliases: ["spirit", "spooky"],
  },
  cat: {
    draw: () => (
      <g {...st}>
        <path d="M-60 90 Q-70 20 -40 0 L40 0 Q70 20 60 90Z" fill="#ffad5e" />
        <path d="M-70 -20 L-74 -96 L-30 -60 Q0 -70 30 -60 L74 -96 L70 -20 Q70 30 0 34 Q-70 30 -70 -20Z" fill="#ffad5e" />
        <path d="M-110 -10 L-50 0 M-110 14 L-50 10 M110 -10 L50 0 M110 14 L50 10" strokeWidth={3} />
      </g>
    ),
    face: { x: 0, y: -22, s: 0.4 },
    aliases: ["kitten", "pet"],
  },
  dog: {
    draw: () => (
      <g {...st}>
        <path d="M-60 90 Q-70 20 -40 0 L40 0 Q70 20 60 90Z" fill="#c8a26b" />
        <circle cy={-30} r={66} fill="#c8a26b" />
        <path d="M-60 -60 Q-96 -40 -84 20 Q-60 10 -54 -30Z M60 -60 Q96 -40 84 20 Q60 10 54 -30Z" fill="#8d5a3b" />
        <ellipse cy={-6} rx={14} ry={10} fill={INK} />
      </g>
    ),
    face: { x: 0, y: -40, s: 0.36 },
    aliases: ["puppy", "animal"],
  },
  fish: {
    draw: (t) => (
      <g {...st} transform={`rotate(${Math.sin(t * 4) * 6})`}>
        <path d={`M60 0 L100 ${-34 + Math.sin(t * 8) * 6} V${34 + Math.sin(t * 8) * 6}Z`} fill="#ff8a3d" />
        <ellipse cx={-10} rx={76} ry={50} fill="#ffad5e" />
        <path d="M10 -40 Q20 0 10 40" fill="none" strokeWidth={4} />
      </g>
    ),
    face: { x: -40, y: 0, s: 0.3 },
    aliases: ["marine"],
  },
  bird: {
    draw: (t) => (
      <g {...st}>
        <ellipse rx={64} ry={50} fill="#4fb3ff" />
        <path d={`M-10 -6 Q-60 ${-60 - Math.sin(t * 14) * 20} -86 -20 Q-50 -10 -10 10Z`} fill="#3f7ff0" />
        <path d="M58 -6 L92 4 L58 16Z" fill="#ffc21a" />
      </g>
    ),
    face: { x: 30, y: -10, s: 0.26 },
    aliases: ["birds"],
  },
  person_icon: {
    draw: (_t, o) => (
      <g {...st}>
        <circle cy={-50} r={34} fill="#fff" />
        <path d="M-56 90 Q-60 0 0 -6 Q60 0 56 90Z" fill={o.color ?? "#4f7bff"} />
      </g>
    ),
    aliases: ["user", "human", "people_icon"],
  },
  bacteria: {
    draw: (t) => (
      <g {...st}>
        {Array.from({ length: 8 }).map((_, i) => <line key={i} x1={0} y1={0} x2={Math.cos(i * 0.785 + t) * 92} y2={Math.sin(i * 0.785 + t) * 70} strokeWidth={5} />)}
        <ellipse rx={74} ry={56} fill="#9be564" />
      </g>
    ),
    face: { x: 0, y: 0, s: 0.4 },
    aliases: ["virus", "germ", "microbe", "disease", "cell"],
  },
  pill: {
    draw: () => (
      <g {...st} transform="rotate(-40)">
        <path d="M-80 0 Q-80 -36 -44 -36 H0 V36 H-44 Q-80 36 -80 0Z" fill="#e53950" />
        <path d="M80 0 Q80 -36 44 -36 H0 V36 H44 Q80 36 80 0Z" fill="#fff" />
      </g>
    ),
    aliases: ["medicine", "drug", "health", "doctor"],
  },
  oil: {
    draw: () => (
      <g {...st}>
        <rect x={-56} y={-80} width={112} height={170} rx={12} fill="#30343f" />
        <path d="M-56 -40 H56 M-56 40 H56" strokeWidth={5} stroke="#90a4ae" />
        <path d="M0 -26 Q22 4 20 14 Q18 30 0 30 Q-18 30 -20 14 Q-22 4 0 -26Z" fill="#ffc21a" strokeWidth={4} />
      </g>
    ),
    aliases: ["petrol", "barrel", "fuel"],
  },
  factory: {
    draw: (t) => (
      <g {...st}>
        <circle cx={60} cy={-90 - ((t * 20) % 16)} r={14} fill="#bdbdbd" opacity={0.8} />
        <rect x={46} y={-80} width={28} height={80} fill="#90a4ae" />
        <path d="M-90 90 V-10 L-50 -40 V-10 L-10 -40 V-10 L30 -40 V0 H90 V90Z" fill="#cfd8dc" />
        <rect x={-70} y={30} width={30} height={30} fill="#ffd23f" strokeWidth={4} />
        <rect x={-20} y={30} width={30} height={30} fill="#ffd23f" strokeWidth={4} />
      </g>
    ),
    aliases: ["industry_factory", "pollution", "production"],
  },
  explosion: {
    draw: (t) => (
      <g>
        <polygon points={spiky(98, 60, 12, 4, t)} fill="#ff7a2f" {...st} />
        <polygon points={spiky(66, 38, 10, 3, t + 1)} fill="#ffd23f" {...st} />
      </g>
    ),
    aliases: ["boom", "bang", "blast", "impact"],
  },
  speech: {
    draw: () => <path d="M-90 -60 Q-90 -84 -66 -84 H66 Q90 -84 90 -60 V20 Q90 44 66 44 H-10 L-50 84 L-40 44 H-66 Q-90 44 -90 20Z" fill="#fff" {...st} />,
    aliases: ["talk", "chat", "conversation"],
  },
  eye: {
    draw: (t) => (
      <g {...st}>
        <path d="M-96 0 Q0 -90 96 0 Q0 90 -96 0Z" fill="#fff" />
        <circle cx={Math.sin(t) * 20} r={34} fill="#3f7ff0" />
        <circle cx={Math.sin(t) * 20} r={16} fill={INK} />
      </g>
    ),
    aliases: ["see", "vision", "watch_eye"],
  },
  arrow_up: {
    draw: (_t, o) => <path d="M0 -92 L76 0 H32 V90 H-32 V0 H-76Z" fill={o.color ?? "#3ddc97"} {...st} />,
    aliases: ["increase", "up", "rise"],
  },
  arrow_down: {
    draw: (_t, o) => <path d="M0 92 L76 0 H32 V-90 H-32 V0 H-76Z" fill={o.color ?? "#e53950"} {...st} />,
    aliases: ["decrease", "down", "fall"],
  },
  telescope: {
    draw: () => (
      <g {...st}>
        <path d="M-30 30 L-60 90 M-30 30 L0 90 M-30 30 L-30 90" strokeWidth={6} />
        <rect x={-80} y={-20} width={150} height={44} rx={10} fill="#4f7bff" transform="rotate(-30)" />
        <rect x={60} y={-50} width={30} height={60} rx={6} fill="#30343f" transform="rotate(-30)" />
      </g>
    ),
    aliases: ["astronomy", "observe"],
  },
  satellite: {
    draw: (t) => (
      <g {...st} transform={`rotate(${Math.sin(t) * 10})`}>
        <rect x={-96} y={-20} width={60} height={40} fill="#3f7ff0" />
        <rect x={36} y={-20} width={60} height={40} fill="#3f7ff0" />
        <rect x={-34} y={-30} width={68} height={60} rx={8} fill="#cfd8dc" />
        <path d="M0 -30 V-60" />
        <circle cy={-66} r={8} fill="#e53950" />
      </g>
    ),
    aliases: ["space_station", "orbit"],
  },
  well: {
    draw: () => (
      <g {...st}>
        <path d="M-60 -50 V-86 M60 -50 V-86 M-74 -86 H74" strokeWidth={9} />
        <path d="M-70 -20 Q0 -46 70 -20 V80 Q0 100 -70 80Z" fill="#c8a26b" />
        <ellipse cy={-20} rx={70} ry={20} fill="#3f7ff0" />
        <path d="M-70 20 Q0 40 70 20 M-70 50 Q0 70 70 50" fill="none" strokeWidth={4} />
        <line x1={0} y1={-86} x2={0} y2={-40} strokeWidth={4} />
        <rect x={-12} y={-44} width={24} height={20} fill="#8d5a3b" strokeWidth={4} />
      </g>
    ),
    aliases: ["spring", "zamzam", "water_well"],
  },
  camel: {
    draw: () => (
      <g {...st}>
        <path d="M-46 24 L-50 92 M-24 28 L-20 92 M28 28 L26 92 M50 24 L54 92" strokeWidth={12} />
        <path d="M-74 18 Q-80 -18 -50 -24 Q-34 -74 -8 -30 Q8 -62 30 -28 Q58 -26 62 6 Q62 32 30 34 L-50 34 Q-72 34 -74 18Z" fill="#d9b77e" />
        <path d="M52 0 Q84 -18 80 -58 L96 -60 Q100 -14 70 22Z" fill="#d9b77e" />
        <ellipse cx={96} cy={-66} rx={20} ry={13} fill="#d9b77e" />
        <circle cx={100} cy={-70} r={3} fill={INK} stroke="none" />
        <path d="M-74 10 Q-92 20 -88 44" fill="none" strokeWidth={6} />
      </g>
    ),
    face: { x: 92, y: -66, s: 0.14 },
    aliases: ["desert_animal", "caravan_camel"],
  },
  sword_crossed: {
    draw: () => (
      <g {...st}>
        {[-40, 40].map((a) => (
          <g key={a} transform={`rotate(${a})`}>
            <path d="M-8 -96 L8 -96 L10 30 L-10 30Z" fill="#e8eef5" />
            <rect x={-36} y={30} width={72} height={14} rx={6} fill="#ffc21a" />
            <rect x={-7} y={44} width={14} height={36} rx={4} fill="#8d5a3b" />
          </g>
        ))}
      </g>
    ),
    aliases: ["conflict", "war_swords", "army"],
  },
};

// alias index
const ALIAS: Record<string, string> = {};
for (const [k, v] of Object.entries(PROPS)) {
  ALIAS[k] = k;
  for (const a of v.aliases ?? []) ALIAS[a] = k;
}
export const resolveProp = (name: string) => ALIAS[name?.toLowerCase?.().replace(/[\s-]+/g, "_")] ?? null;
export const PROP_NAMES = Object.keys(PROPS);

export type PropArtProps = {
  name: string;
  size?: number; // px width of the 200-unit box
  face?: Expression | boolean;
  mouth?: number;
  blink?: boolean;
  t?: number;
  color?: string;
  color2?: string;
  glow?: boolean;
  look?: { x: number; y: number };
};

/** Draws a prop centred at (0,0). */
export const PropArt: React.FC<PropArtProps> = ({ name, size = 200, face, mouth = 0, blink, t = 0, color, color2, glow, look }) => {
  const key = resolveProp(name) ?? "question";
  const art = PROPS[key];
  const s = size / 200;
  const f = art.face ?? { x: 0, y: 0, s: 0.4 };
  const expr: Expression | null = face === true ? "happy" : face ? (face as Expression) : null;
  return (
    <g transform={`scale(${s})`}>
      {art.draw(t, { color, color2, glow })}
      {expr && (
        <g transform={`translate(${f.x} ${f.y}) scale(${f.s})`}>
          <Face expression={expr} mouth={mouth} blink={blink} look={look ?? { x: 0, y: 0.1 }} stroke={7} />
        </g>
      )}
    </g>
  );
};
