import React from "react";
import type { Art } from "./Props";
import { INK } from "./theme";

// Things in the family's home: Benny's kitchen table and orders, Berry's easel, Wendy's garage screen. House style
// (ART_STYLE.md): flat fills, a thick ink outline. Each one stands on the bottom edge of the box (y = 100).
const line = { stroke: INK, strokeWidth: 6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const thin = { ...line, strokeWidth: 4 };
const wood = "#c58c58", darkWood = "#8a5a3b", kraft = "#d6a86c", cream = "#fff9df", yellow = "#ffc83d";

const bow = (x: number, y: number, s: number, c: string) => <g transform={`translate(${x} ${y}) scale(${s})`} {...line} strokeWidth={5 / s}>
  <path d="M-4 4 L-16 26 M4 4 L16 26" fill="none" stroke={INK} strokeWidth={13} /><path d="M-4 4 L-16 26 M4 4 L16 26" fill="none" stroke={c} strokeWidth={6} />
  <path d="M0 0 Q-32 -28 -38 -4 Q-34 18 0 0 Q32 -28 38 -4 Q34 18 0 0Z" fill={c} />
  <circle r={7} fill={c} />
</g>;

/** A closed food box with a ribbon and bow. */
const box = (x: number, y: number, w: number, h: number, c: string, k: React.Key = 0) => <g key={k} {...line}>
  <path d={`M${x - w / 2} ${y - h + 9} H${x + w / 2} L${x + w / 2 - 6} ${y} H${x - w / 2 + 6}Z`} fill="#fff" />
  <rect x={x - w / 2 - 5} y={y - h} width={w + 10} height={14} rx={4} fill="#fff" />
  <path d={`M${x} ${y - h + 3} V${y - 3}`} stroke={c} strokeWidth={9} strokeLinecap="butt" />
  {bow(x, y - h - 1, 0.55, c)}
</g>;

const noodles = <g fill="none" stroke="#e9a13b" strokeWidth={7}>
  <path d="M-50 2 Q-30 -24 -8 -4 T30 -10 T52 4" /><path d="M-38 -6 Q-16 -34 8 -14 T42 -14" stroke={yellow} /><path d="M-52 12 Q-20 -10 8 6 T52 10" stroke={yellow} />
</g>;

const LEG = (x: number, y: number) => <path key={x} d={`M${x} ${y} V100`} fill="none" strokeWidth={14} />;

export const HOME_PROPS: Record<string, Art> = {
  // A long table seen from the front (x ±190). At size 0.5 it spans a 9:16 frame; its top is 108 units up.
  // Actors stand or sit behind it when it is at zIndex 6.
  kitchen_table: { aliases: ["dining_table", "long_table"], draw: (_, o) => <g {...line}>
    {[-160, 160].map((x) => LEG(x, 20))}
    <path d="M-182 10 H182 L174 64 H-174Z" fill={o.color2 ?? "#f6efe0"} />
    <path d="M-176 46 H176" fill="none" stroke="#e53950" strokeWidth={5} />
    <rect x={-190} y={-8} width={380} height={18} rx={6} fill={o.color ?? wood} />
  </g> },
  // The back of a chair, for an empty place at the table.
  kitchen_chair: { aliases: ["dining_chair", "chair"], draw: (_, o) => <g {...line}>
    <path d="M-56 100 V-70 M56 100 V-70" fill="none" strokeWidth={14} />
    <path d="M-62 -84 Q0 -104 62 -84 V-48 H-62Z" fill={o.color ?? wood} /><rect x={-58} y={-30} width={116} height={22} rx={6} fill={o.color ?? wood} />
    <rect x={-66} y={22} width={132} height={22} rx={8} fill={o.color2 ?? "#82c9be"} />
  </g> },
  // A stack of ribboned food boxes, and one box on its own (color = the ribbon).
  food_boxes: { aliases: ["takeaway_boxes", "stack_of_boxes"], draw: (_, o) => <g>
    {[0, 1, 2, 3].map((i) => box(i % 2 ? -5 : 5, 100 - i * 46, 120, 40, o.color ?? ["#ff6b8b", "#3b8df0", "#3ddc97", "#8e62d9"][i], i))}
  </g> },
  food_box: { aliases: ["takeaway_box"], draw: (_, o) => box(0, 100, 150, 96, o.color ?? yellow) },
  // An open box of noodles with chopsticks, its ribbon lying beside it.
  noodle_box: { aliases: ["noodles", "open_food_box"], draw: () => <g {...line}>
    <path d="M22 18 L74 -62 M38 22 L92 -50" stroke={INK} strokeWidth={11} /><path d="M22 18 L74 -62 M38 22 L92 -50" stroke={wood} strokeWidth={5} />
    <g transform="translate(0 24)"><path d="M-62 14 Q-50 -34 0 -32 Q50 -34 62 14Z" fill="#f3b54a" />{noodles}</g>
    <path d="M-74 34 H74 L58 100 H-58Z" fill="#fff" /><path d="M-74 34 L-104 14 M74 34 L104 14" fill="none" strokeWidth={9} />
    <path d="M-22 68 Q0 52 22 68" fill="none" stroke="#e53950" strokeWidth={6} />
  </g> },
  // A pan of noodles, handle to the left, for `holding` at the stove.
  noodle_pan: { aliases: ["wok", "pan", "frying_pan"], draw: (t) => <g {...line}>
    <path d="M-30 56 H-96" stroke={INK} strokeWidth={22} /><path d="M-34 56 H-94" stroke="#4b5563" strokeWidth={10} />
    <g transform="translate(34 42)">{noodles}</g>
    <path d="M-36 44 H104 Q96 96 34 98 Q-28 96 -36 44Z" fill="#30343f" />
    {[10, 58].map((x, i) => <path key={x} d={`M${x} ${4 + Math.sin(t * 3 + i) * 4} q-14 -18 0 -34 q14 -18 0 -34`} fill="none" stroke="#ffffff" strokeWidth={6} opacity={0.7} />)}
  </g> },
  cooking_spoon: { aliases: ["spoon", "tasting_spoon", "wooden_spoon"], draw: () => <g {...line}>
    <path d="M0 -8 V96" stroke={INK} strokeWidth={22} /><path d="M0 -8 V94" stroke={wood} strokeWidth={10} />
    <ellipse cy={-50} rx={36} ry={46} fill={wood} /><ellipse cy={-54} rx={24} ry={30} fill="#e8693c" strokeWidth={4} />
  </g> },
  // A loose ribbon tied in a bow (color).
  ribbon_bow: { aliases: ["yellow_ribbon", "bow_ribbon"], draw: (_, o) => bow(0, 56, 1.7, o.color ?? yellow) },
  // The hallway's garage door standing open (put it exactly on that door: hallway, x 0.779, y 0.834, size 0.55).
  open_doorway: { aliases: ["open_garage_door"], draw: () => <g {...line}>
    <rect x={-60} y={-100} width={120} height={200} fill={cream} /><rect x={-50} y={-90} width={100} height={190} fill="#3c3f78" />
    <path d="M-50 -60 Q0 -40 50 -60" fill="none" strokeWidth={3} />{[-34, -10, 14, 38].map((x, i) => <circle key={x} cx={x} cy={-48} r={6} fill={[yellow, "#ff6b8b", "#3ddc97", "#5aa6e8"][i]} strokeWidth={3} />)}
    <path d="M50 -90 L84 -78 V112 L50 100Z" fill="#5b78b8" />
  </g> },
  // Berry's easel from behind: we see the back of the canvas and the legs.
  easel: { aliases: ["easel_back", "canvas_on_easel"], draw: (_, o) => <g {...line}>
    <path d="M0 -96 L-66 100 M0 -96 L66 100" fill="none" strokeWidth={17} /><path d="M0 -96 L-66 98 M0 -96 L66 98" fill="none" stroke={wood} strokeWidth={7} />
    <rect x={-84} y={-80} width={168} height={124} rx={4} fill={o.color ?? cream} />
    <rect x={-70} y={-66} width={140} height={96} fill="none" stroke={darkWood} strokeWidth={5} />
    <path d="M0 -66 V30 M-70 -18 H70" stroke={darkWood} strokeWidth={5} />
    <path d="M0 -98 V100" strokeWidth={17} /><path d="M0 -96 V98" stroke={wood} strokeWidth={7} />
    <rect x={-92} y={42} width={184} height={14} rx={4} fill={wood} />
  </g> },
  paintbrush: { aliases: ["brush", "artist_brush"], draw: (_, o) => <g {...line} transform="rotate(28)">
    <path d="M0 -30 V96" stroke={INK} strokeWidth={17} /><path d="M0 -30 V94" stroke={wood} strokeWidth={7} />
    <rect x={-11} y={-56} width={22} height={30} rx={3} fill="#b0bec5" /><path d="M-13 -56 Q-18 -82 2 -98 Q18 -80 13 -56Z" fill={o.color ?? "#3ddc97"} />
  </g> },
  // A packed lunch in a paper bag, and one sandwich.
  paper_bag: { aliases: ["lunch_bag", "picnic_bag"], draw: () => <g {...line}>
    <path d="M-52 -46 H52 L58 100 H-58Z" fill={kraft} /><path d="M-56 -78 L-40 -68 L-24 -78 L-8 -68 L8 -78 L24 -68 L40 -78 L56 -68 V-40 H-56Z" fill="#c9965f" />
    <path d="M-14 24 q14 -20 28 0 q-14 26 -28 0" fill="#e53950" {...thin} />
  </g> },
  sandwich: { aliases: ["half_sandwich"], draw: () => <g {...line}>
    <path d="M-80 66 L0 -52 L80 66Z" fill="#f6d79a" /><path d="M-86 70 H86 L72 88 H-72Z" fill="#6aa84f" /><path d="M-76 88 H76 L66 100 H-66Z" fill="#f6d79a" />
    <path d="M-40 40 L0 -20" fill="none" stroke="#ffffff" strokeWidth={5} opacity={0.6} />
  </g> },
  // A soft floor seat for someone sitting low (pose sit_front): a pouf.
  pouf: { aliases: ["floor_cushion", "cushion"], draw: (_, o) => <g {...line}>
    <path d="M-88 22 Q-100 100 -66 100 H66 Q100 100 88 22Z" fill={o.color ?? "#8e62d9"} /><ellipse cy={22} rx={90} ry={26} fill={o.color2 ?? "#a98be8"} />
    <path d="M-34 50 V96 M34 50 V96" fill="none" strokeWidth={4} opacity={0.5} />
  </g> },
  // A game screen from behind on a low stand, so players behind it (zIndex below it) face us.
  screen_back: { aliases: ["monitor_back", "tv_back"], draw: (t, o) => <g {...line}>
    <rect x={-150} y={62} width={300} height={38} rx={6} fill={darkWood} />
    <path d="M-34 62 L-22 34 H22 L34 62Z" fill="#4b5563" />
    <rect x={-104} y={-40} width={208} height={84} rx={10} fill={o.color ?? "#30343f"} />
    <rect x={-40} y={-22} width={80} height={44} rx={6} fill="#444a58" /><path d="M-28 -8 H28 M-28 6 H28" {...thin} />
    <path d="M-102 -38 H102" fill="none" stroke="#9fe7ff" strokeWidth={7} opacity={0.75 + Math.sin(t * 2.2) * 0.2} />
  </g> },
};
