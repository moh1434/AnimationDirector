import React, { useId } from "react";
import { INK, resolveColor } from "./theme";
import { CelFilter, sid } from "./shade";

/**
 * Three more rooms of the family's home, drawn like the other story settings (floor line at 82 %, flat fills, thick
 * ink outline): Wendy's game workshop in the garage, the hallway outside its door (the door is on the right), and
 * Benny's kitchen (fridge on the left, stove on the right, a window that shows the time of day).
 * `time` darkens the room; the lamps stay lit.
 */
export const HOME_SETTINGS = ["garage", "hallway", "home_kitchen"] as const;

export const HomeSetting: React.FC<{ type: string; W: number; H: number; color?: string; color2?: string; time?: "day" | "dusk" | "night" }> = ({ type, W, H, color, color2, time = "day" }) => {
  const u = Math.min(W, H) / 1080, G = H * 0.82;
  const id = "home" + sid(useId());
  const cel = `url(#${id}cel)`;
  const st = { stroke: INK, strokeWidth: 6, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  const at = (x: number, y = G, s = 1) => `translate(${W * x} ${y}) scale(${u * s})`;
  const dark = { day: 0, dusk: 0.14, night: 0.32 }[time];
  const garage = type === "garage";
  const bulbs = [0.06, 0.17, 0.28, 0.39, 0.5, 0.61, 0.72, 0.83, 0.94].map((x, i) => [x, H * 0.13 + Math.sin(i * Math.PI / 2 + 0.6) * 18 * u] as const);
  const colours = ["#ffc83d", "#ff6b8b", "#3ddc97", "#5aa6e8"];
  return <>
    <defs><CelFilter id={`${id}cel`} depth={15} opacity={0.2} /></defs>
    {garage ? <>
      <rect width={W} height={H} fill={resolveColor(color, "#c9d3e6")} />
      <rect width={W} height={H * 0.05} fill="#8f9bb5" />
      {/* game posters */}
      <g transform={`translate(${W * 0.33} ${H * 0.365}) rotate(-3) scale(${u * 0.85})`} {...st}><rect x={-92} y={-112} width={184} height={224} rx={6} fill="#5b4b9a" /><path d="M0 -70 L20 -24 L70 -20 L32 12 L44 62 L0 36 L-44 62 L-32 12 L-70 -20 L-20 -24Z" fill="#ffc83d" /><path d="M-60 88 H60" stroke="#fff" strokeWidth={9} /></g>
      <g transform={`translate(${W * 0.66} ${H * 0.37}) rotate(2) scale(${u * 0.85})`} {...st}><rect x={-110} y={-84} width={220} height={168} rx={6} fill="#82c9be" /><path d="M-70 56 V-10 H-40 V-40 H-10 V-10 H20 V56Z" fill="#e8836b" /><path d="M36 56 Q40 4 72 10 Q98 22 90 56Z" fill="#3ddc97" /></g>
      {/* the roll-up door */}
      <g transform={at(0.5)} {...st}>
        <rect x={-330} y={-640} width={660} height={640} fill="#eef1f6" />
        {[-560, -480, -400, -320, -240, -160, -80].map((y) => <path key={y} d={`M-330 ${y} H330`} stroke="#b8c2d6" strokeWidth={5} />)}
        {[-210, -70, 70, 210].map((x) => <rect key={x} x={x - 54} y={-622} width={108} height={50} rx={6} fill={time === "day" ? "#a8dcff" : time === "dusk" ? "#ffc59a" : "#27336f"} />)}
        <path d="M-342 0 V-654 H342 V0" fill="none" strokeWidth={15} />
      </g>
      <rect y={G} width={W} height={H - G} fill={resolveColor(color2, "#9aa3b5")} />
      <path d={`M0 ${G} H${W}`} stroke={INK} strokeWidth={6 * u} />
      <ellipse cx={W * 0.5} cy={H * 0.91} rx={W * 0.44} ry={H * 0.045} fill="#5b4b9a" stroke={INK} strokeWidth={5 * u} />
      <ellipse cx={W * 0.5} cy={H * 0.91} rx={W * 0.35} ry={H * 0.029} fill="#7c68c4" />
      {/* a workbench shelf on the left, a tool board on the right */}
      <g transform={at(0.02)} {...st} filter={cel}>
        <path d="M-40 0 V-520 M150 0 V-520" fill="none" strokeWidth={15} />
        {[-500, -330, -160].map((y) => <rect key={y} x={-60} y={y} width={230} height={22} rx={5} fill="#c58c58" />)}
        <rect x={-10} y={-400} width={70} height={70} fill="#e8836b" /><rect x={70} y={-382} width={66} height={52} fill="#82c9be" />
        <rect x={0} y={-236} width={120} height={76} fill="#c9965f" /><path d="M0 -204 H120" />
        <path d="M30 -500 V-556 H96 V-500" fill="#ffc83d" />
      </g>
      <g transform={at(0.97)} {...st} filter={cel}>
        <rect x={-150} y={-560} width={220} height={250} rx={8} fill="#c58c58" />
        <path d="M-110 -520 V-430 M-126 -520 H-94" strokeWidth={15} /><path d="M-40 -520 V-410" strokeWidth={13} /><circle cx={-40} cy={-400} r={20} fill="#b0bec5" />
        <rect x={-120} y={-190} width={190} height={190} rx={6} fill="#e53950" /><path d="M-120 -128 H70 M-120 -64 H70" /><circle cx={-25} cy={-160} r={7} fill="#fff" /><circle cx={-25} cy={-96} r={7} fill="#fff" /><circle cx={-25} cy={-32} r={7} fill="#fff" />
      </g>
    </> : type === "home_kitchen" ? <>
      <rect width={W} height={H} fill={resolveColor(color, "#ffeccb")} />
      <rect width={W} height={H * 0.05} fill="#fff9df" />
      {/* tiles behind the counters */}
      <rect y={G - 430 * u} width={W} height={430 * u} fill="#d8efe9" stroke={INK} strokeWidth={5 * u} />
      {[-322, -215, -107].map((y) => <path key={y} d={`M0 ${G + y * u} H${W}`} stroke="#b5d9d1" strokeWidth={5 * u} />)}
      {Array.from({ length: 9 }).map((_, i) => <path key={i} d={`M${W * (i + 1) / 10} ${G - 426 * u} V${G}`} stroke="#b5d9d1" strokeWidth={5 * u} />)}
      {/* the window */}
      <g transform={`translate(${W * 0.5} ${H * 0.415}) scale(${u})`} {...st}>
        <rect x={-190} y={-150} width={380} height={300} rx={6} fill={time === "day" ? "#bfe6ff" : time === "dusk" ? "#ffc59a" : "#27336f"} />
        <path d="M-186 150 V80 Q-90 10 10 70 T186 60 V150Z" fill={time === "night" ? "#2f5a4c" : "#9edb8c"} strokeWidth={5} />
        {time === "night" && <circle cx={95} cy={-75} r={34} fill="#fff4c8" stroke="none" />}
        <path d="M0 -150 V150 M-190 0 H190" fill="none" /><rect x={-214} y={148} width={428} height={24} rx={5} fill="#fff9df" />
        <path d="M-222 -176 H222 V-112 Q185 -84 148 -112 Q111 -84 74 -112 Q37 -84 0 -112 Q-37 -84 -74 -112 Q-111 -84 -148 -112 Q-185 -84 -222 -112Z" fill="#e8836b" />
        <path d="M120 148 V118 H166 V148" fill="#e88851" /><path d="M143 116 Q116 96 124 72 Q146 84 143 116 Q146 84 168 70 Q172 98 143 116Z" fill="#3ddc97" strokeWidth={5} />
      </g>
      {/* a shelf of jars on the left, hanging pans on the right */}
      <g transform={`translate(${W * 0.11} ${H * 0.49}) scale(${u})`} {...st} filter={cel}>
        <rect x={-130} y={0} width={240} height={20} rx={5} fill="#c58c58" />
        <rect x={-100} y={-78} width={54} height={78} rx={8} fill="#e8693c" /><rect x={-104} y={-92} width={62} height={18} rx={5} fill="#fff9df" />
        <rect x={-28} y={-60} width={50} height={60} rx={8} fill="#ffc83d" /><rect x={-32} y={-74} width={58} height={18} rx={5} fill="#fff9df" />
        <rect x={40} y={-86} width={46} height={86} rx={8} fill="#6aa84f" /><rect x={36} y={-100} width={54} height={18} rx={5} fill="#fff9df" />
      </g>
      <g transform={`translate(${W * 0.88} ${H * 0.42}) scale(${u})`} {...st} filter={cel}>
        <path d="M-120 0 H120" strokeWidth={12} /><path d="M-64 0 V70" strokeWidth={9} /><circle cx={-64} cy={112} r={46} fill="#4b5563" /><circle cx={-64} cy={112} r={30} fill="#6b7686" strokeWidth={4} />
        <path d="M46 0 V52" strokeWidth={9} /><circle cx={46} cy={84} r={36} fill="#e53950" /><circle cx={46} cy={84} r={22} fill="#f2707f" strokeWidth={4} />
      </g>
      {/* fridge and stove */}
      <g transform={at(0)} {...st} filter={cel}>
        <rect x={-40} y={-600} width={230} height={600} rx={18} fill="#82c9be" /><path d="M-40 -360 H190" /><path d="M160 -440 V-390 M160 -320 V-230" strokeWidth={11} />
        <rect x={30} y={-540} width={76} height={60} fill="#fff9df" strokeWidth={4} transform="rotate(-5 68 -510)" /><circle cx={68} cy={-536} r={7} fill="#e53950" strokeWidth={3} />
      </g>
      <g transform={at(1)} {...st} filter={cel}>
        <rect x={-215} y={-265} width={260} height={265} rx={8} fill="#fff9df" /><rect x={-226} y={-286} width={270} height={26} rx={6} fill="#4b5563" />
        <rect x={-186} y={-180} width={170} height={140} rx={12} fill="#a4c4ce" /><path d="M-186 -206 H-20" strokeWidth={9} />
        <path d="M-170 -290 Q-170 -340 -110 -340 H-60 Q-10 -340 -10 -290Z" fill="#e8836b" /><path d="M-90 -340 V-362" strokeWidth={13} />
      </g>
      {/* a hanging lamp */}
      <g transform={`translate(${W * 0.5} 0) scale(${u})`} {...st}><path d="M0 0 V170" fill="none" /><path d="M-92 256 Q-80 160 0 160 Q80 160 92 256Z" fill="#3ea89a" /></g>
      <rect y={G} width={W} height={H - G} fill={resolveColor(color2, "#d8b99a")} />
      <path d={`M0 ${G} H${W}`} stroke={INK} strokeWidth={6 * u} />
    </> : <>
      <rect width={W} height={H} fill={resolveColor(color, "#dfeee6")} />
      <rect width={W} height={H * 0.05} fill="#fff9df" />
      <rect y={G - 230 * u} width={W} height={230 * u} fill="#fff9ee" stroke={INK} strokeWidth={5 * u} />
      {[0.08, 0.22, 0.36, 0.5, 0.64, 0.78, 0.92].map((x) => <path key={x} d={`M${W * x} ${G - 226 * u} V${G - 4}`} stroke="#d9cfb8" strokeWidth={5 * u} />)}
      <rect y={G} width={W} height={H - G} fill={resolveColor(color2, "#c99a6d")} />
      <path d={`M0 ${G} H${W}`} stroke={INK} strokeWidth={6 * u} />
      {[0.87, 0.93].map((k) => <path key={k} d={`M0 ${H * k} H${W}`} stroke={INK} strokeOpacity={0.14} strokeWidth={4 * u} />)}
      <path d={`M${W * 0.1} ${H * 0.96} L${W * 0.18} ${H * 0.86} H${W * 0.82} L${W * 0.9} ${H * 0.96}Z`} fill="#5f9ea0" stroke={INK} strokeWidth={5 * u} />
      {/* hooks with coats, a family picture, the garage door */}
      <g transform={at(0.2)} {...st} filter={cel}>
        <rect x={-150} y={-470} width={300} height={34} rx={6} fill="#c58c58" />
        <path d="M-90 -436 Q-140 -420 -134 -210 H-46 Q-40 -420 -90 -436Z" fill="#f6c220" /><path d="M40 -436 Q-8 -420 -4 -230 H84 Q88 -420 40 -436Z" fill="#d9774e" />
        <circle cx={-90} cy={-444} r={9} fill="#b0bec5" /><circle cx={40} cy={-444} r={9} fill="#b0bec5" /><circle cx={118} cy={-444} r={9} fill="#b0bec5" />
      </g>
      <g transform={at(0.76)} {...st}>
        <rect x={-162} y={-540} width={324} height={540} fill="#fff9df" /><rect x={-134} y={-514} width={268} height={514} rx={5} fill="#5b78b8" />
        <rect x={-96} y={-470} width={192} height={160} rx={6} fill="none" strokeWidth={5} /><rect x={-96} y={-270} width={192} height={220} rx={6} fill="none" strokeWidth={5} />
        <circle cx={-104} cy={-262} r={13} fill="#ffc83d" />
        <g transform="translate(0 -390) rotate(-4)"><rect x={-54} y={-36} width={108} height={72} rx={14} fill="#8e62d9" /><path d="M-32 0 H-8 M-20 -12 V12" strokeWidth={8} stroke="#fff" /><circle cx={20} cy={6} r={7} fill="#ffc83d" stroke="none" /><circle cx={36} cy={-8} r={7} fill="#ff6b8b" stroke="none" /></g>
      </g>
      <g transform={`translate(${W * 0.45} ${H * 0.5}) scale(${u})`} {...st}><rect x={-66} y={-80} width={132} height={160} fill="#fff" strokeWidth={10} /><circle cx={-18} cy={-6} r={24} fill="#f6c220" /><circle cx={22} cy={10} r={20} fill="#b04a78" /></g>
    </>}
    {dark > 0 && <rect width={W} height={H} fill="#2a2f6b" opacity={dark} />}
    {type === "home_kitchen" && time !== "day" && [260, 180, 110].map((k) => <circle key={k} cx={W * 0.5} cy={262 * u} r={k * u} fill="#ffe08a" opacity={0.13} />)}
    {garage && <g>
      <path d={`M${bulbs.map(([x, y]) => `${W * x} ${y}`).join(" L")}`} fill="none" stroke={INK} strokeWidth={4 * u} />
      {bulbs.map(([x, y], i) => <g key={x}>{time !== "day" && <circle cx={W * x} cy={y + 16 * u} r={40 * u} fill={colours[i % 4]} opacity={0.22} />}<circle cx={W * x} cy={y + 16 * u} r={14 * u} fill={colours[i % 4]} stroke={INK} strokeWidth={4 * u} /></g>)}
    </g>}
  </>;
};
