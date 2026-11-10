import React from "react";
import type { Art } from "./Props";
import { INK } from "./theme";

// Furniture and story objects. Same 200-unit canvas as the core library, but each one stands on the
// bottom edge of the box (y = 100), so `"anchor": "bottom"` puts it exactly on the floor.
const line = { stroke: INK, strokeWidth: 6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const wood = "#c58c58", darkWood = "#8a5a3b", yellow = "#ffc83d", red = "#e53950", blue = "#3b8df0";

const wheel = (x: number, t = 0) => <g key={x} transform={`translate(${x} 74)`}>
  <circle r={25} fill="#30343f" {...line} /><circle r={11} fill="#d7dbe0" {...line} strokeWidth={4} />
  <path d="M-8 0 H8" transform={`rotate(${t * 200})`} {...line} strokeWidth={4} />
</g>;

export const STAGING_PROPS: Record<string, Art> = {
  police_car: { aliases: ["patrol_car", "cop_car"], draw: (t, o) => {
    const flash = Math.floor(t * 6) % 2 === 0;
    return <g {...line}>
      <path d="M-94 74 V38 Q-94 24 -76 22 L-46 -8 Q-38 -18 -22 -18 H26 Q40 -18 50 -8 L76 20 Q98 24 98 44 V74Z" fill={o.color ?? "#fff"} />
      <path d="M-94 74 V48 H98 V74Z" fill={o.color2 ?? "#2e4a7d"} />
      <path d="M-36 -6 H-4 V20 H-60Z M6 -6 H34 Q42 -6 48 2 L62 20 H6Z" fill="#a8dcff" />
      <path d="M0 -18 V74" fill="none" />
      <path d="M-26 40 l5 11 12 1 -9 8 3 12 -11 -6 -11 6 3 -12 -9 -8 12 -1Z" fill={yellow} strokeWidth={3} transform="translate(26 -14) scale(.7)" />
      <rect x={-26} y={-34} width={52} height={16} rx={5} fill="#d7dbe0" />
      <rect x={-22} y={-40} width={22} height={12} rx={4} fill={flash ? red : "#7a2030"} />
      <rect x={0} y={-40} width={22} height={12} rx={4} fill={flash ? "#26324f" : blue} />
      {wheel(-58)}{wheel(60)}
    </g>;
  } },
  cupboard: { aliases: ["wardrobe", "closet"], draw: (_, o) => <g {...line}>
    <rect x={-74} y={-92} width={148} height={180} rx={6} fill={o.color ?? wood} />
    <rect x={-84} y={-100} width={168} height={16} rx={5} fill={o.color2 ?? darkWood} />
    <path d="M0 -84 V88" fill="none" />
    <rect x={-60} y={-70} width={46} height={136} rx={4} fill="none" strokeWidth={4} /><rect x={14} y={-70} width={46} height={136} rx={4} fill="none" strokeWidth={4} />
    <circle cx={-9} cy={0} r={5} fill={yellow} strokeWidth={3} /><circle cx={9} cy={0} r={5} fill={yellow} strokeWidth={3} />
    <path d="M-62 88 V100 M62 88 V100" fill="none" strokeWidth={10} />
  </g> },
  cupboard_open: { aliases: ["open_cupboard", "open_wardrobe", "open_closet"], draw: (_, o) => <g {...line}>
    <rect x={-74} y={-92} width={148} height={180} rx={6} fill="#3a2a22" />
    <rect x={-84} y={-100} width={168} height={16} rx={5} fill={o.color2 ?? darkWood} />
    <path d="M-74 -92 L-122 -72 V108 L-74 88Z" fill={o.color ?? wood} />
    <path d="M74 -92 L122 -72 V108 L74 88Z" fill={o.color ?? wood} />
    <path d="M-62 88 V100 M62 88 V100" fill="none" strokeWidth={10} />
  </g> },
  table: { aliases: ["coffee_table", "side_table"], draw: (_, o) => <g {...line}>
    <rect x={-92} y={10} width={184} height={18} rx={6} fill={o.color ?? wood} />
    <path d="M-92 28 H92 L78 52 H-78Z" fill={o.color2 ?? "#fff9df"} />
    <path d="M-68 52 V100 M68 52 V100" fill="none" strokeWidth={12} />
  </g> },
  flower_pot: { aliases: ["flowerpot", "plant_pot"], draw: (_, o) => <g {...line}>
    <path d="M0 16 V-44 M0 -6 Q-40 -8 -44 -38 Q-8 -36 0 -6 M0 6 Q40 4 44 -26 Q8 -24 0 6" fill="#3ddc97" />
    {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cy={-76} rx={13} ry={18} transform={`rotate(${a} 0 -54)`} fill={o.color2 ?? red} />)}
    <circle cy={-54} r={14} fill={yellow} />
    <path d="M-50 22 H50 L36 100 H-36Z" fill={o.color ?? "#e88851"} /><rect x={-58} y={12} width={116} height={20} rx={5} fill={o.color ?? "#e88851"} />
  </g> },
  broken_pot: { aliases: ["smashed_pot"], draw: (_, o) => <g {...line}>
    <path d="M-92 100 Q-70 62 -30 72 Q6 44 42 72 Q78 64 94 100Z" fill="#6b4a33" />
    <path d="M-86 100 L-68 54 L-34 70 L-46 100Z" fill={o.color ?? "#e88851"} />
    <path d="M46 100 L58 48 L90 78 L88 100Z" fill={o.color ?? "#e88851"} />
    <path d="M-12 92 L6 66 L30 92Z" fill={o.color ?? "#e88851"} />
    <path d="M-20 62 Q-44 26 -8 10" fill="none" stroke="#2fa871" strokeWidth={8} />
    {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cy={-14} rx={11} ry={15} transform={`rotate(${a} 0 4)`} fill={o.color2 ?? red} />)}
    <circle cy={4} r={11} fill={yellow} />
  </g> },
  open_window: { aliases: ["window"], draw: (_, o) => <g {...line}>
    <rect x={-72} y={-92} width={144} height={170} fill={o.color ?? "#27336f"} />
    <path d="M-72 -92 L-118 -70 V68 L-72 78Z" fill="#a8dcff" /><path d="M72 -92 L118 -70 V68 L72 78Z" fill="#a8dcff" />
    <rect x={-84} y={-100} width={168} height={12} fill={o.color2 ?? "#fff9df"} />
    <rect x={-92} y={78} width={184} height={22} rx={5} fill={o.color2 ?? "#fff9df"} />
  </g> },
  // rises to the right, four treads; at size 0.256 the top reaches a window sill. Use "flip" to rise to the left
  stairs: { aliases: ["steps", "wooden_steps"], draw: (_, o) => <g {...line}>
    <path d="M-75 100 V50 H-37.5 V0 H0 V-50 H37.5 V-100 H75 V100Z" fill={o.color ?? wood} />
    {[[-75, 50], [-37.5, 0], [0, -50], [37.5, -100]].map(([x, y]) => <rect key={x} x={x - 3} y={y} width={43.5} height={10} rx={3} fill={o.color2 ?? "#e8c27a"} />)}
    <path d="M-37.5 50 V100 M0 0 V100 M37.5 -50 V100" fill="none" strokeWidth={3} />
  </g> },
  door: { aliases: ["front_door"], draw: (_, o) => <g {...line}>
    <rect x={-66} y={-100} width={132} height={200} rx={6} fill={o.color ?? darkWood} />
    <rect x={-46} y={-78} width={92} height={62} rx={4} fill="none" strokeWidth={4} /><rect x={-46} y={0} width={92} height={78} rx={4} fill="none" strokeWidth={4} />
    <circle cx={46} cy={-4} r={8} fill={yellow} strokeWidth={4} />
  </g> },
  nail: { draw: (_, o) => <g {...line}>
    <path d="M-12 -86 H12 L5 -68 V70 L0 100 L-5 70 V-68Z" fill={o.color ?? "#b0bec5"} />
    <path d="M-34 -96 H34 L26 -80 H-26Z" fill={o.color ?? "#b0bec5"} />
  </g> },
  loot_bag: { aliases: ["swag_bag", "stolen_bag", "sack"], draw: (_, o) => <g {...line}>
    <path d="M-20 -42 Q-92 -6 -82 58 Q-72 100 0 100 Q72 100 82 58 Q92 -6 20 -42Z" fill={o.color ?? "#4b5563"} />
    <path d="M-24 -46 Q-44 -92 -18 -82 Q0 -100 18 -82 Q44 -92 24 -46Z" fill={o.color ?? "#4b5563"} />
    <path d="M-28 -44 H28" strokeWidth={12} stroke={yellow} />
    <path d="M-58 22 Q0 0 58 22 M-62 54 Q0 34 62 54" fill="none" stroke="#fff" strokeWidth={10} />
  </g> },
  tool_bag: { aliases: ["tools", "toolbag", "tool_kit"], draw: (_, o) => <g {...line}>
    <path d="M-46 -6 Q-46 -62 0 -62 Q46 -62 46 -6" fill="none" strokeWidth={13} />
    <path d="M-34 -30 L-14 -70 M32 -28 L22 -80" fill="none" stroke="#b0bec5" strokeWidth={14} />
    <path d="M-90 2 H90 L78 100 H-78Z" fill={o.color ?? red} />
    <path d="M-88 28 H88" fill="none" /><rect x={-16} y={18} width={32} height={22} rx={4} fill={yellow} />
  </g> },
  alarm_light: { aliases: ["alarm", "siren_light"], draw: (t, o) => {
    const on = Math.floor(t * 6) % 2 === 0;
    return <g {...line}>
      {on && [-60, -30, 0, 30, 60].map((a) => <path key={a} d="M0 -68 V-98" transform={`rotate(${a} 0 34)`} stroke={red} strokeWidth={10} />)}
      <path d="M-58 62 V4 Q-58 -48 0 -48 Q58 -48 58 4 V62Z" fill={on ? (o.color ?? red) : "#8c2436"} />
      <path d="M-34 -2 Q-30 -26 -8 -30" fill="none" stroke="#fff" strokeWidth={8} />
      <rect x={-76} y={62} width={152} height={38} rx={7} fill="#4b5563" />
    </g>;
  } },
  school_bus: { aliases: ["bus"], draw: (_, o) => <g {...line}>
    <path d="M-96 74 V-22 Q-96 -36 -80 -36 H62 Q78 -36 84 -18 L96 18 V74Z" fill={o.color ?? yellow} />
    {[-78, -38, 2].map((x) => <rect key={x} x={x} y={-22} width={32} height={30} rx={4} fill="#a8dcff" />)}
    <path d="M42 -22 H62 Q70 -22 74 -14 L84 12 H42Z" fill="#a8dcff" />
    <path d="M-96 28 H96" fill="none" stroke={INK} strokeWidth={8} />
    {wheel(-58)}{wheel(60)}
  </g> },
  hay_bale: { aliases: ["hay"], draw: (_, o) => <g {...line}>
    <rect x={-92} y={8} width={184} height={92} rx={14} fill={o.color ?? "#e8c27a"} />
    <path d="M-44 8 V100 M44 8 V100" stroke="#a8743d" strokeWidth={10} />
    <path d="M-76 34 l12 -6 M-14 62 l14 -6 M66 36 l12 -6 M-72 74 l13 -5 M18 26 l12 -6" fill="none" strokeWidth={4} />
  </g> },
  slobber: { aliases: ["drool"], draw: (t) => <g {...line} strokeWidth={4} fill="#a8e6f0">
    {[[-46, -30, 1], [10, -62, 0.8], [52, -8, 1.1], [-14, 26, 0.7]].map(([x, y, s], i) => <path key={i} transform={`translate(${x} ${y + ((t * 80 + i * 25) % 60)}) scale(${s})`} d="M0 -24 Q22 8 0 18 Q-22 8 0 -24Z" />)}
  </g> },
};
