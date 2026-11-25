import React from "react";
import type { Art } from "./Props";
import { INK } from "./theme";

// Everyday family objects in the house style (ART_STYLE.md): flat fills, a thick ink outline, a single
// light stroke for shine. Same 200-unit canvas as the core library; each one stands on the bottom edge
// of the box (y = 100), so `"anchor": "bottom"` puts it on the floor or a table top.
const line = { stroke: INK, strokeWidth: 6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const shine = (d: string, w = 5) => <path d={d} fill="none" stroke="#ffffff" strokeWidth={w} strokeLinecap="round" opacity={0.55} />;

const appleAt = (x: number, y: number, s = 1, c = "#e2453c", k = 0) => (
  <g key={k} transform={`translate(${x} ${y}) scale(${s})`} {...line}>
    <path d="M0 -14 C-8 -22 -26 -18 -26 0 C-26 18 -12 28 0 22 C12 28 26 18 26 0 C26 -18 8 -22 0 -14Z" fill={c} />
    <path d="M0 -14 Q2 -24 6 -28" fill="none" strokeWidth={4} />
    <path d="M4 -22 Q14 -30 22 -24 Q14 -16 4 -22Z" fill="#6aa84f" strokeWidth={3.5} />
    {shine("M-16 -6 Q-15 -12 -10 -14", 4)}
  </g>
);

type O = { color?: string; color2?: string };
// Drawn wide (x ±220, beyond the 200-unit box) so that at size ≈ 0.5 it spans a 9:16 frame edge to edge.
const dash = (t: number, o: O, turn: boolean) => (
  <g {...line}>
    <path d="M-222 -4 Q-110 -30 0 -30 Q110 -30 222 -4 L222 100 H-222Z" fill={o.color ?? "#3b3e4a"} />
    <path d="M-222 -4 Q-110 -30 0 -30 Q110 -30 222 -4" fill="none" stroke="#5d6170" strokeWidth={6} />
    {shine("M-190 -8 Q-100 -26 -20 -26", 4)}
    <rect x={-150} y={2} width={46} height={18} rx={6} fill="#262830" />
    <rect x={-26} y={-6} width={52} height={24} rx={5} fill="#14161c" />
    <text x={0} y={12} textAnchor="middle" fontSize={17} fontWeight={700} fill="#7ff0c8" stroke="none" fontFamily="monospace">4:40</text>
    <path d="M-222 52 H222" fill="none" stroke="#2c2e37" strokeWidth={4} />
    <g transform={`translate(80 36) rotate(${turn ? -28 * Math.min(1, t / 1.2) : 0})`}>
      <circle r={48} fill="none" stroke={INK} strokeWidth={19} />
      <circle r={48} fill="none" stroke="#2b2d35" strokeWidth={10} />
      <path d="M-44 8 L-14 10 L0 30 L14 10 L44 8" fill="none" stroke={INK} strokeWidth={13} />
      <path d="M-44 8 L-14 10 L0 30 L14 10 L44 8" fill="none" stroke="#2b2d35" strokeWidth={6} />
      <circle r={15} fill="#2b2d35" />
      <circle r={5} fill="#5d6170" stroke="none" />
    </g>
  </g>
);
const bowl = (n: number, o: O) => {
  const spots = [[-34, 38], [34, 38], [0, 34], [-17, 14], [17, 14]];
  return (
    <g>
      {spots.slice(0, n).map(([x, y], i) => appleAt(x, y, 1, i % 2 ? "#e2453c" : "#f05a46", i))}
      <g {...line}>
        <path d="M-80 46 Q-76 96 0 98 Q76 96 80 46Z" fill={o.color ?? "#c98a50"} />
        <path d="M-84 46 H84" fill="none" strokeWidth={6} />
        <path d="M-58 64 Q0 78 58 64" fill="none" stroke="#9a6234" strokeWidth={4} />
      </g>
    </g>
  );
};

export const FAMILY_PROPS: Record<string, Art> = {
  // The car's dashboard seen from in front of the car, for scenes inside a car (bg "car" / "car_park"): put it
  // in front of the seated actors (zIndex 6), anchored to the bottom of the frame, about 1.05 wide. The steering
  // wheel is on the right (the driver's side, seen from the front), with a little digital clock in the middle.
  car_dash: {
    aliases: ["dashboard", "car_front"],
    draw: (t, o) => dash(t, o, false),
  },
  // The same dashboard while the car turns: the wheel turns over the prop's first 1.2 s.
  car_dash_turn: { aliases: ["dashboard_turning"], draw: (t, o) => dash(t, o, true) },
  // A playground swing set: an A-frame with two swings that sway (color: frame, color2: seats).
  swing_set: {
    aliases: ["swings", "swing", "playground"],
    draw: (t, o) => {
      const frame = o.color ?? "#e2533f", seat = o.color2 ?? "#ffc83d";
      const swing = (x: number, ph: number, k: number) => (
        <g key={k} transform={`rotate(${Math.sin(t * 1.6 + ph) * 7} ${x} -70)`}>
          <path d={`M${x - 16} -70 V36 M${x + 16} -70 V36`} fill="none" strokeWidth={3.5} />
          <rect x={x - 22} y={34} width={44} height={10} rx={4} fill={seat} />
        </g>
      );
      return (
        <g {...line}>
          {[-1, 1].map((s) => <path key={s} d={`M${s * 82} -74 L${s * 98} 100 M${s * 82} -74 L${s * 66} 100`} fill="none" stroke={INK} strokeWidth={13} />)}
          {[-1, 1].map((s) => <path key={`c${s}`} d={`M${s * 82} -74 L${s * 98} 100 M${s * 82} -74 L${s * 66} 100`} fill="none" stroke={frame} strokeWidth={6} />)}
          <path d="M-92 -76 H92" fill="none" stroke={INK} strokeWidth={14} />
          <path d="M-92 -76 H92" fill="none" stroke={frame} strokeWidth={7} />
          {swing(-36, 0, 0)}
          {swing(36, 1.9, 1)}
        </g>
      );
    },
  },
  // A wooden fruit bowl full of apples, and the same bowl with only two in it (fill it in two steps).
  fruit_bowl: { aliases: ["bowl", "apple_bowl", "fruit"], draw: (_, o) => bowl(5, o) },
  fruit_bowl_partial: { aliases: ["bowl_two_apples"], draw: (_, o) => bowl(2, o) },
  apple_red: { aliases: ["single_apple"], draw: () => appleAt(0, 74, 1.7) },
  // A milk carton.
  milk: {
    aliases: ["milk_carton", "carton"],
    draw: (_, o) => (
      <g {...line}>
        <path d="M-34 -40 L-34 100 H34 V-40 L20 -70 H-20Z" fill="#ffffff" />
        <path d="M-34 -40 H34 M-20 -70 L-12 -40 M20 -70 L12 -40" fill="none" strokeWidth={4} />
        <rect x={-20} y={-84} width={40} height={14} rx={3} fill="#ffffff" />
        <rect x={-34} y={0} width={68} height={56} fill={o.color ?? "#5aa6e8"} />
        <path d="M-20 34 Q-8 18 0 34 Q8 18 20 34" fill="none" stroke="#ffffff" strokeWidth={5} />
      </g>
    ),
  },
  // A brown paper grocery bag with greens and a baguette.
  grocery_bag: {
    aliases: ["groceries", "shopping_bag"],
    draw: () => (
      <g {...line}>
        <path d="M-22 -40 L-10 -96 Q-2 -100 2 -92 L-6 -36Z" fill="#e8b96a" />
        <path d="M6 -40 Q0 -80 22 -84 Q30 -62 20 -38Z" fill="#6aa84f" />
        <path d="M-60 -40 H60 L66 100 H-66Z" fill="#c9965f" />
        <path d="M-60 -40 L-52 -26 L-44 -40 L-36 -26 L-28 -40 L-20 -26 L-12 -40 L-4 -26 L4 -40 L12 -26 L20 -40 L28 -26 L36 -40 L44 -26 L52 -40 L60 -26" fill="none" strokeWidth={3.5} />
        {shine("M-46 -8 V70", 6)}
      </g>
    ),
  },
  // A little green house with a crooked porch (its roof and posts lean), seen across the street.
  green_house: {
    aliases: ["crooked_porch_house", "little_green_house"],
    draw: (_, o) => (
      <g {...line}>
        <rect x={-74} y={-36} width={148} height={136} fill={o.color ?? "#8cc68a"} />
        <path d="M-92 -30 L0 -98 L92 -30Z" fill={o.color2 ?? "#5d7f9c"} />
        <rect x={-54} y={-14} width={34} height={30} fill="#fff4c8" strokeWidth={4} />
        <rect x={22} y={-14} width={34} height={30} fill="#fff4c8" strokeWidth={4} />
        <rect x={-16} y={36} width={32} height={64} rx={3} fill="#a76d4a" />
        {/* the crooked porch: a roof that sags to one side on two leaning posts */}
        <path d="M-58 22 L60 32 L64 44 L-60 32Z" fill="#c98a50" />
        <path d="M-52 32 L-56 100 M54 42 L60 100" fill="none" strokeWidth={6} />
        <path d="M-66 100 H70" fill="none" strokeWidth={6} />
        <path d="M-60 -30 Q0 -40 60 -30" fill="none" stroke="#ffffff" strokeWidth={4} opacity={0.4} />
      </g>
    ),
  },
  // A wide stone front step to put in front of a house's door (anchor bottom on the path). Its top is 44 of the
  // 200 units up, so at size 0.5 in a 9:16 frame people sit on it with "sit_front" a little in front of it.
  front_step: {
    aliases: ["porch_step", "doorstep", "step"],
    draw: (_, o) => (
      <g {...line}>
        <rect x={-100} y={56} width={200} height={44} rx={4} fill={o.color ?? "#d9d0c3"} />
        <path d="M-94 64 H94" fill="none" stroke="#ffffff" strokeWidth={5} opacity={0.6} />
        <path d="M-40 56 V100 M44 56 V100" fill="none" strokeWidth={3.5} opacity={0.35} />
      </g>
    ),
  },
  // A pair of shoes side by side; `color` sets them (default Berry's coral). Several pairs: several props.
  shoes: {
    aliases: ["pair_of_shoes", "sneakers"],
    draw: (_, o) => {
      const c = o.color ?? "#ff6b5e";
      const shoe = (x: number, k: number) => (
        <g key={k} transform={`translate(${x} 0)`} {...line}>
          <path d="M-44 96 Q-48 64 -30 60 Q-16 58 -8 70 L20 76 Q46 80 46 96Z" fill={c} />
          <path d="M-46 92 H46 Q48 100 40 100 H-40 Q-48 100 -46 92Z" fill="#ffffff" strokeWidth={4} />
          {shine("M-30 68 Q-22 64 -14 70", 4)}
        </g>
      );
      return <g>{shoe(-46, 0)}{shoe(46, 1)}</g>;
    },
  },
  // A soft knitted sweater, held up by its shoulders (for `holding`) or folded; `color` sets it.
  sweater: {
    aliases: ["jumper", "cardigan_held"],
    draw: (_, o) => {
      const c = o.color ?? "#9cc3e8";
      return (
        <g {...line}>
          <path d="M-40 -60 Q-20 -46 0 -46 Q20 -46 40 -60 L84 -30 L72 20 L50 10 L52 96 H-52 L-50 10 L-72 20 L-84 -30Z" fill={c} />
          <path d="M-22 -50 Q0 -30 22 -50" fill="none" strokeWidth={4} />
          <path d="M-52 84 H52 M-70 12 L-50 4 M70 12 L50 4" fill="none" strokeWidth={4} opacity={0.6} />
          {[-24, 0, 24].map((x) => <path key={x} d={`M${x} -20 V76`} fill="none" stroke="#ffffff" strokeWidth={4} opacity={0.3} strokeDasharray="6 8" />)}
        </g>
      );
    },
  },
};
