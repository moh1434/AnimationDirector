import React, { useId } from "react";
import type { Art } from "./Props";
import { Face, isBlinking } from "./Face";
import { INK } from "./theme";
import { sid } from "./shade";

// The delivery guy and his motorcycle, facing right (use "flip" to ride left). Drawn at the characters' own
// scale (560 units tall, ground at y = 0) and shrunk into the 200-unit prop box, so his outline has the same
// weight as theirs. Stands on the bottom edge of the box: use `"anchor": "bottom"`.
// `color` is the motorcycle, `color2` his jacket and helmet (and the food box).
type O = { color?: string; color2?: string };
const line = { stroke: INK, strokeWidth: 7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const BIKE = "#3b8df0", KIT = "#ff7a1a", METAL = "#b0bec5", DARK = "#30343f", TROUSERS = "#37477a";

/** The helmet's face opening (and the face in it). */
const FACE_HOLE = "M-44 18 C-44 -30 -12 -52 26 -52 H78 Q94 -20 93 14 C91 54 64 86 24 86 C-14 86 -44 56 -44 18Z";

/** A limb: a thick stroke with an outline, like the characters' arms and legs. */
const tube = (d: string, w: number, fill: string) => <>
  <path d={d} fill="none" stroke={INK} strokeWidth={w + 13} strokeLinecap="round" strokeLinejoin="round" />
  <path d={d} fill="none" stroke={fill} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
</>;

const wheel = (x: number, spin: number) => <g transform={`translate(${x} -66)`} {...line}>
  <circle r={62} fill={DARK} />
  <circle r={38} fill="#e4e8ec" />
  <g transform={`rotate(${spin})`}>{[0, 60, 120].map((a) => <path key={a} d="M-36 0 H36" transform={`rotate(${a})`} stroke="#78838f" strokeWidth={6} />)}</g>
  <circle r={12} fill={METAL} />
</g>;

/** Everything behind the rider's near leg. */
const bike = (c: string, spin: number) => <g {...line}>
  {wheel(-165, spin)}{wheel(182, spin)}
  {/* swing arm and rear shock */}
  {tube("M-165 -66 L-20 -92", 13, METAL)}
  {tube("M-138 -88 L-112 -176", 10, "#ffc83d")}
  {/* front fork and mudguard */}
  {tube("M182 -66 L122 -262", 15, METAL)}
  <path d="M112 -92 Q122 -150 184 -146 Q238 -142 250 -100 Q224 -126 184 -126 Q140 -126 128 -84Z" fill={c} />
  {/* engine */}
  <path d="M-38 -160 L92 -166 L78 -112 L-28 -104Z" fill={DARK} />
  <rect x={-2} y={-138} width={66} height={60} rx={8} fill={METAL} />
  <path d="M6 -122 H56 M6 -107 H56" strokeWidth={5} />
  <rect x={-46} y={-92} width={116} height={54} rx={24} fill="#8f9ba6" />
  <circle cx={-12} cy={-65} r={15} fill="#e4e8ec" strokeWidth={5} />
  {/* exhaust */}
  {tube("M58 -84 Q92 -60 60 -38 L-70 -34", 11, METAL)}
  {tube("M-84 -34 L-196 -46", 26, METAL)}
  {/* tail, seat and tank */}
  <path d="M-212 -216 L-30 -206 L-18 -150 L-120 -156 Q-190 -168 -226 -200Z" fill={c} />
  <path d="M-232 -214 l-20 4 6 26 24 -4Z" fill="#e53950" />
  <path d="M-196 -230 Q-110 -240 -6 -222 L-14 -196 Q-110 -206 -196 -204Z" fill={DARK} />
  <path d="M-16 -158 Q-22 -224 24 -240 Q84 -258 118 -222 Q116 -176 78 -160Z" fill={c} />
  <path d="M4 -200 Q14 -222 44 -226" fill="none" stroke="#fff" strokeWidth={8} opacity={0.7} />
  {/* headlight */}
  <path d="M112 -262 Q148 -276 166 -252 L168 -208 Q140 -188 112 -206Z" fill={c} />
  <ellipse cx={166} cy={-230} rx={16} ry={26} fill="#fff2a8" />
  {/* handlebar and mirror */}
  {tube("M128 -262 L118 -286 L72 -290", 9, DARK)}
  <path d="M120 -288 L136 -326" strokeWidth={8} /><ellipse cx={140} cy={-338} rx={17} ry={13} fill="#bfe8ff" />
</g>;

const rack = <path d="M-266 -226 H-150 M-240 -226 L-196 -208" stroke={INK} strokeWidth={12} fill="none" strokeLinecap="round" />;

/** Benny's orders: an insulated food box with a covered dish on it. */
const foodBox = (c: string) => <g {...line}>
  <rect x={-282} y={-372} width={148} height={142} rx={14} fill={c} />
  <path d="M-282 -338 H-134" />
  <g fill="#fff9df" strokeWidth={6}>
    <path d="M-248 -264 Q-248 -310 -208 -310 Q-168 -310 -168 -264Z" /><circle cx={-208} cy={-316} r={7} /><path d="M-256 -262 H-160" strokeWidth={9} />
  </g>
</g>;

/** Berry's orders: a wrapped painting, and a small jewelry box with a ribbon in front of it. */
const artParcels = <g {...line}>
  <g transform="rotate(-4 -210 -230)">
    <rect x={-284} y={-416} width={144} height={186} rx={5} fill="#d6a86c" />
    <path d="M-284 -366 H-140 M-182 -416 V-230" stroke="#ff6b8b" strokeWidth={11} />
    <path d="M-182 -366 q-32 -34 -40 -8 q4 18 40 8 q32 -34 40 -8 q-4 18 -40 8" fill="#ff6b8b" strokeWidth={5} />
  </g>
  <rect x={-276} y={-292} width={76} height={62} rx={6} fill="#8e62d9" />
  <path d="M-238 -292 V-230" stroke="#ffc83d" strokeWidth={10} />
  <path d="M-276 -276 H-200" stroke={INK} strokeWidth={5} />
</g>;

const JACKET = "M-122 -206 Q-128 -290 -78 -338 H10 Q44 -318 34 -272 Q14 -222 -4 -196 Q-70 -184 -122 -206Z";
const STRIPE = "M-150 -242 Q-60 -220 50 -238";
/** The jacket, with a reflective stripe clipped to it so it ends exactly at the outline. */
const Jacket: React.FC<{ kit: string }> = ({ kit }) => {
  const id = "jk" + sid(useId());
  return <g {...line}>
    <clipPath id={id}><path d={JACKET} /></clipPath>
    <path d={JACKET} fill={kit} stroke="none" />
    <g clipPath={`url(#${id})`} fill="none">
      <path d={STRIPE} strokeWidth={24} /><path d={STRIPE} stroke="#fff9df" strokeWidth={15} />
    </g>
    <path d={JACKET} fill="none" />
  </g>;
};

const rider = (kit: string, t: number, nod: number) => <g {...line}>
  {/* far leg and far arm */}
  <g transform="translate(18 4)">{tube("M-52 -214 Q62 -232 72 -190 L52 -104", 38, "#2b3864")}</g>
  {tube("M12 -318 Q52 -270 104 -292", 32, kit)}
  {/* near leg and shoe */}
  {tube("M-64 -210 Q50 -226 56 -182 L34 -100", 44, TROUSERS)}
  <path d="M4 -92 Q6 -112 34 -110 Q52 -108 58 -94 Q88 -90 88 -70 H2 Q0 -82 4 -92Z" fill="#fff" /><path d="M2 -72 H88" strokeWidth={9} />
  <path d="M-18 -60 H60" strokeWidth={11} />
  <Jacket kit={kit} />
  {/* near arm and hand */}
  {tube("M-34 -306 Q-16 -232 88 -286", 36, kit)}
  <ellipse cx={96} cy={-290} rx={21} ry={19} fill="#fff" /><path d="M94 -300 q14 2 14 12" fill="none" strokeWidth={4} />
  {/* head in a round open-face helmet (dark lining, chin bar, riveted visor), nodding a little with the road */}
  <g transform={`translate(-26 -404) rotate(${nod})`}>
    <circle r={109} fill={kit} />
    <path d={FACE_HOLE} fill={DARK} transform="translate(-7 0)" />
    <path d={FACE_HOLE} fill="#fff" />
    <g transform="translate(29 22) scale(.77)"><Face expression="happy" eyeStyle="big" blink={isBlinking(Math.round(t * 60), 60, 11)} look={{ x: 0.3, y: 0.05 }} stroke={8} /></g>
    <path d="M-85 -27 Q-66 -80 -6 -90" fill="none" stroke="#fff" strokeWidth={11} />
    <g transform="translate(-8 0)">
    <path d="M-14 -37 Q42 -68 104 -60 Q113 -53 111 -43 Q130 -38 138 -24 Q140 -14 104 -15 Q50 -32 -2 -14 Q-18 -14 -14 -33Z" fill={DARK} />
    <path d="M-2 -15 Q52 -42 111 -42" fill="none" strokeWidth={5} />
    <circle cx={2} cy={-30} r={5} fill="#fff" stroke="none" /><circle cx={98} cy={-50} r={5} fill="#fff" stroke="none" />
    </g>
  </g>
</g>;

// the box's bottom edge is the ground; the small shift right centres the parcels, the wheels and the visor in it
const stage = (n: React.ReactNode) => <g transform="translate(6 100) scale(.375)">{n}</g>;
const riding = (t: number, o: O, cargo: (kit: string) => React.ReactNode, waiting = false) => {
  const kit = o.color2 ?? KIT, bob = Math.sin(t * (waiting ? 11 : 15)) * (waiting ? 0.8 : 2.5), spin = waiting ? 20 : t * 420;
  return stage(<>
    {/* the road rushing past */}
    {!waiting && <g stroke="#fff" strokeWidth={10} strokeLinecap="round" opacity={0.8}>
      {[[-352, 0], [-182, 0.4], [-66, 0.75]].map(([y, p], i) => {
        const k = (t * 1.7 + p) % 1;
        return <path key={i} d={`M${-316 - k * 90} ${y} h${-60 * Math.sin(Math.PI * k)}`} opacity={Math.sin(Math.PI * k)} />;
      })}
    </g>}
    <g transform={`translate(0 ${bob}) rotate(${waiting ? 0 : Math.sin(t * 7.5) * 0.5})`}>
      {rack}{cargo(kit)}{bike(o.color ?? BIKE, spin)}{rider(kit, t, waiting ? Math.sin(t * 1.4) * 2 : Math.sin(t * 7.5 + 1) * 1.6)}
    </g>
  </>);
};

export const DELIVERY_PROPS: Record<string, Art> = {
  // riding with Benny's food
  delivery_rider: { aliases: ["delivery_guy", "delivery_rider_food"], draw: (t, o) => riding(t, o, foodBox) },
  // riding with Berry's paintings and jewelry
  delivery_rider_art: { aliases: ["delivery_guy_art", "delivery_rider_parcels"], draw: (t, o) => riding(t, o, () => artParcels) },
  // the same, stopped at the door with the engine running (wheels still, no speed lines)
  delivery_rider_waiting: { aliases: ["delivery_guy_waiting"], draw: (t, o) => riding(t, o, foodBox, true) },
  delivery_rider_art_waiting: { aliases: ["delivery_guy_art_waiting"], draw: (t, o) => riding(t, o, () => artParcels, true) },
  // parked, with nobody on it
  delivery_motorcycle: {
    aliases: ["motorcycle", "motorbike"],
    draw: (_, o) => stage(<>{rack}{foodBox(o.color2 ?? KIT)}<g {...line}>{tube("M-34 -50 L-58 -8", 9, METAL)}</g>{bike(o.color ?? BIKE, 20)}</>),
  },
};
