import React from "react";
import { INK, resolveColor } from "./theme";
import { CelFilter } from "./shade";

/**
 * Places a story happens in. Actors stand on the ground line at 82 % of the height, so every setting
 * keeps that line. `time` gives day, dusk or night versions: the picture is drawn once, darkened by
 * one flat layer, and the lights (windows, lamps) are drawn again on top so they glow.
 */
export const STORY_SETTINGS = ["living_room", "house_exterior", "park", "schoolyard", "street"] as const;
export type TimeOfDay = "day" | "dusk" | "night";

const GROUND = 0.82;
const SKY: Record<TimeOfDay, string> = { day: "#bfe6ff", dusk: "#ffc59a", night: "#27336f" };
const SKY_TOP: Record<TimeOfDay, string> = { day: "#7fc4ff", dusk: "#ff9d86", night: "#141b52" };
const SKY_LOW: Record<TimeOfDay, string> = { day: "#e8f7ff", dusk: "#ffe2b0", night: "#3b4a94" };
const DARK: Record<TimeOfDay, [string, number]> = { day: ["#000", 0], dusk: ["#a1425e", 0.16], night: ["#10163f", 0.5] };
const ROOM_DARK = "#2a2f6b"; // indoors a blue dusk reads better than the outdoor black
const GLOW = "#ffe08a";
const st = { stroke: INK, strokeWidth: 6, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

// Scenery takes the same cel shade as the actors (filter "setCel", defined once per setting).
const CEL = "url(#setCel)";
const Tree: React.FC<{ tone?: string }> = ({ tone = "#52b882" }) => <g {...st}>
  <path d="M-30 0 L-22 -340 H22 L30 0Z" fill="#ba885b" filter={CEL} />
  <g filter={CEL}><path d="M-150 -300 Q-215 -400 -120 -440 Q-140 -570 -20 -570 Q80 -640 130 -530 Q240 -500 170 -400 Q210 -310 130 -290Z" fill={tone} /></g>
  <path d="M-96 -420 Q-104 -500 -34 -522 M-50 -372 Q-20 -356 20 -366 M60 -470 Q104 -470 118 -432" fill="none" stroke="#ffffff" strokeWidth={9} opacity={0.22} />
</g>;

const Bush: React.FC<{ tone?: string }> = ({ tone = "#3d986d" }) => <g filter={CEL}><path d="M-110 0 Q-140 -70 -70 -74 Q-40 -125 10 -86 Q80 -106 90 -50 Q130 -30 110 0Z" fill={tone} {...st} /></g>;

const Fence: React.FC<{ from: number; to: number }> = ({ from, to }) => {
  const posts: number[] = [];
  for (let x = from; x <= to; x += 62) posts.push(x);
  return <g {...st} fill="#fff9df">
    <rect x={from - 20} y={-104} width={to - from + 40} height={18} /><rect x={from - 20} y={-54} width={to - from + 40} height={18} />
    {posts.map((x) => <path key={x} d={`M${x - 18} 0 V-128 L${x} -150 L${x + 18} -128 V0Z`} />)}
  </g>;
};

const Clouds: React.FC<{ W: number; H: number; u: number }> = ({ W, H, u }) => <g opacity={0.92}>
  {[[0.2, 0.3, 1.1], [0.74, 0.25, 0.8], [0.52, 0.4, 0.7]].map(([x, y, s]) => <g key={x} transform={`translate(${W * x} ${H * y}) scale(${s * u})`}>
    <g fill="#c9d6f2" transform="translate(6 12)"><ellipse cx={-62} cy={8} rx={72} ry={34} /><ellipse cx={62} cy={10} rx={72} ry={32} /><ellipse cy={-22} rx={68} ry={46} /></g>
    <g fill="#fff"><ellipse cx={-62} cy={8} rx={72} ry={34} /><ellipse cx={62} cy={10} rx={72} ry={32} /><ellipse cy={-22} rx={68} ry={46} /></g>
  </g>)}
</g>;

/** Drawn after the darkening layer, so the stars and moon stay bright. */
const NightSky: React.FC<{ W: number; H: number; u: number }> = ({ W, H, u }) => <>
  {Array.from({ length: 34 }).map((_, i) => <circle key={i} cx={(((i * 197) % 100) / 100) * W} cy={(0.04 + (((i * 83) % 100) / 100) * 0.34) * H} r={(2 + (i % 3)) * u} fill="#fff" opacity={0.85} />)}
  <path transform={`translate(${W * 0.76} ${H * 0.34}) scale(${u})`} d="M26 -72 A76 76 0 1 0 72 26 A60 60 0 1 1 26 -72Z" fill="#fff4c8" />
</>;

const Sky: React.FC<{ W: number; H: number; u: number; time: TimeOfDay; color?: string }> = ({ W, H, u, time, color }) => <>
  <defs>
    <linearGradient id={`skyG${time}`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={SKY_TOP[time]} /><stop offset="0.82" stopColor={resolveColor(color, SKY[time])} /><stop offset="1" stopColor={SKY_LOW[time]} />
    </linearGradient>
  </defs>
  <rect width={W} height={H} fill={color ? resolveColor(color, SKY[time]) : `url(#skyG${time})`} />
  {time !== "night" && <Clouds W={W} H={H} u={u} />}
</>;

const STREET_HOUSE = 0.85; // keeps houses taller than the people walking past
const HOUSE_WALL = 700;
const STREET_COLOURS = [["#bfe0d0", "#3d6fb0"], ["#ffd9a8", "#e8836b"], ["#f4c3d0", "#7c5ce0"]];
/**
 * A row of houses from the centre outwards, walls side by side. They must not overlap: lit windows
 * are drawn again above the darkening layer, so a window hidden behind a neighbour would show on its wall.
 */
export const streetHouses = (W: number, u: number) => {
  const step = (HOUSE_WALL + 24) * STREET_HOUSE * u;
  const reach = Math.ceil(W / 2 / step);
  return Array.from({ length: reach * 2 + 1 }, (_, i) => i - reach)
    .sort((a, b) => Math.abs(b) - Math.abs(a)) // the centre house last, so its roof is on top
    .map((k) => { const [wall, roof] = STREET_COLOURS[((k % 3) + 3) % 3]; return { x: 0.5 + (k * step) / W, wall, roof }; });
};
const HOUSE_WINDOWS = [-225, 225];
const House: React.FC<{ lit?: boolean; wall?: string; roof?: string }> = ({ lit, wall = "#ffe4ad", roof = "#7c5ce0" }) => {
  const pane = lit ? GLOW : "#a8dcff";
  const windows = HOUSE_WINDOWS.map((x) => <g key={x} {...st}>
    <rect x={x - 66} y={-342} width={132} height={128} fill={pane} />
    <path d={`M${x} -342 V-214 M${x - 66} -278 H${x + 66}`} fill="none" />
  </g>);
  if (lit) return <>{windows}</>;
  return <g {...st}>
    <rect x={180} y={-690} width={78} height={170} fill="#c9775a" />
    <rect x={-350} y={-452} width={700} height={452} fill={wall} />
    <path d="M-404 -446 L0 -668 L404 -446Z" fill={roof} />
    <rect x={-74} y={-246} width={148} height={246} rx={6} fill="#8a5a3b" />
    <circle cx={46} cy={-118} r={10} fill="#ffc83d" />
    <rect x={-108} y={-20} width={216} height={20} fill="#c9c4ae" />
    {windows}
  </g>;
};

const Lamp: React.FC<{ lit?: boolean }> = ({ lit }) => <g {...st}>
  {lit && [120, 84, 52].map((r) => <circle key={r} cy={-428} r={r} fill={GLOW} opacity={0.16} stroke="none" />)}
  <path d="M-9 0 V-400 H9 V0Z" fill="#4b5563" />
  <path d="M-26 -400 L-34 -452 H34 L26 -400Z" fill={lit ? GLOW : "#fff4c8"} />
  <path d="M-38 -452 H38" />
</g>;

const LivingRoom: React.FC<{ W: number; H: number; u: number; time: TimeOfDay; wall: string; floor: string }> = ({ W, H, u, time, wall, floor }) => {
  const G = H * GROUND;
  return <>
    <rect width={W} height={H} fill={wall} />
    <rect width={W} height={H * 0.05} fill="#fff9df" />
    <rect y={G - 250 * u} width={W} height={250 * u} fill="#eab98a" stroke={INK} strokeWidth={5 * u} />
    {[0.1, 0.3, 0.5, 0.7, 0.9].map((x) => <rect key={x} x={W * x - 70 * u} y={G - 214 * u} width={140 * u} height={170 * u} rx={8 * u} fill="none" stroke="#c8935f" strokeWidth={6 * u} />)}
    <rect y={G} width={W} height={H - G} fill={floor} />
    <path d={`M0 ${G} H${W}`} stroke={INK} strokeWidth={6 * u} />
    {[0.87, 0.93].map((k) => <path key={k} d={`M0 ${H * k} H${W}`} stroke={INK} strokeOpacity={0.14} strokeWidth={4 * u} />)}
    <ellipse cx={W * 0.5} cy={H * 0.9} rx={W * 0.42} ry={H * 0.045} fill="#d7514f" stroke={INK} strokeWidth={5 * u} />
    <ellipse cx={W * 0.5} cy={H * 0.9} rx={W * 0.33} ry={H * 0.028} fill="#f2a65a" />
    <g transform={`translate(${W * 0.27} ${H * 0.46}) scale(${u})`} {...st}>
      <rect x={-170} y={-210} width={340} height={380} rx={6} fill={SKY[time]} />
      {time === "night" && <><circle cx={70} cy={-110} r={42} fill="#fff4c8" stroke="none" /><circle cx={92} cy={-120} r={36} fill={SKY.night} stroke="none" /></>}
      <path d="M0 -210 V170 M-170 -30 H170" fill="none" />
      <path d="M-208 -236 Q-190 -40 -214 176 H-142 Q-122 -30 -100 -236Z M208 -236 Q190 -40 214 176 H142 Q122 -30 100 -236Z" fill="#7c5ce0" />
      <path d="M-226 -238 H226" strokeWidth={16} />
    </g>
    <g transform={`translate(${W * 0.76} ${H * 0.4}) scale(${u})`} {...st}>
      <rect x={-96} y={-120} width={192} height={240} fill="#fff9df" strokeWidth={12} />
      <path d="M-66 76 L-14 -22 L24 36 L46 8 L70 76Z" fill="#52b882" /><circle cx={38} cy={-58} r={24} fill="#ffc83d" />
    </g>
    <g transform={`translate(${W * 0.5} 0) scale(${u})`} {...st}>
      <path d="M0 0 V190" fill="none" />
      <path d="M-82 270 Q0 150 82 270Z" fill="#ffc83d" />
    </g>
    <g transform={`translate(${W * 0.05} ${G}) scale(${u})`} {...st}>
      <rect x={-250} y={-250} width={400} height={170} rx={34} fill="#3ea89a" />
      <rect x={-270} y={-120} width={440} height={94} rx={26} fill="#4cc2b2" />
      <path d="M-210 -26 V0 M130 -26 V0" fill="none" strokeWidth={12} />
    </g>
    <g transform={`translate(${W * 0.93} ${G}) scale(${u})`}><Lamp lit={time !== "day"} /></g>
  </>;
};

const Scene: React.FC<{ type: string; W: number; H: number; u: number; time: TimeOfDay; color?: string; color2?: string }> = ({ type, W, H, u, time, color, color2 }) => {
  const G = H * GROUND;
  const at = (x: number, s = 1, y = G) => `translate(${W * x} ${y}) scale(${u * s})`;
  const grass = resolveColor(color2, "#9edb8c");
  const ground = <>
    <defs><linearGradient id="grassG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" stopOpacity={0.22} /><stop offset="0.5" stopColor="#ffffff" stopOpacity={0} /><stop offset="1" stopColor="#14301c" stopOpacity={0.2} /></linearGradient></defs>
    <rect y={G} width={W} height={H - G} fill={grass} />
    <rect y={G} width={W} height={H - G} fill="url(#grassG)" />
    <path d={`M0 ${G} H${W}`} stroke={INK} strokeWidth={5 * u} />
  </>;
  switch (type) {
    case "house_exterior":
      return <>
        <path d={`M0 ${G - 40 * u} Q${W * 0.3} ${G - 150 * u} ${W * 0.62} ${G - 50 * u} T${W} ${G - 70 * u} V${G} H0Z`} fill="#b8dfa6" />
        <g transform={at(0.08, 1.3)}><Tree /></g>
        {ground}
        <g transform={at(0.5, Math.min(1.25, W / (u * 900)))}><House /></g>
        <g transform={at(0.06)}><Fence from={-120} to={150} /></g>
        <g transform={at(0.94)}><Fence from={-150} to={120} /></g>
        <g transform={at(0.13, 0.9)}><Bush /></g>
        <g transform={at(0.87, 0.9)}><Bush /></g>
        <path d={`M${W * 0.42} ${G} L${W * 0.3} ${H} H${W * 0.7} L${W * 0.58} ${G}Z`} fill="#e9dcc2" stroke={INK} strokeWidth={5 * u} />
      </>;
    case "park":
      return <>
        <path d={`M0 ${G - 90 * u} Q${W * 0.25} ${G - 210 * u} ${W * 0.55} ${G - 90 * u} T${W} ${G - 130 * u} V${G} H0Z`} fill="#b8dfa6" />
        <g transform={at(0.3, 0.9)}><Tree tone="#7ccf8e" /></g>
        <g transform={at(0.08, 1.45)}><Tree /></g>
        <g transform={at(0.92, 1.3)}><Tree tone="#3d986d" /></g>
        {ground}
        <g transform={at(0.67)} {...st} filter={CEL}>
          <rect x={-170} y={-170} width={340} height={26} rx={6} fill="#c58c58" /><rect x={-170} y={-126} width={340} height={26} rx={6} fill="#c58c58" />
          <rect x={-182} y={-86} width={364} height={28} rx={6} fill="#e8a451" />
          <path d="M-142 -58 V0 M142 -58 V0 M-142 -170 V-86 M142 -170 V-86" fill="none" strokeWidth={13} />
        </g>
        <g transform={at(0.42, 0.85)}><Lamp lit={time !== "day"} /></g>
        <path d={`M${W * 0.2} ${H} Q${W * 0.5} ${H * 0.87} ${W * 0.46} ${G} H${W * 0.56} Q${W * 0.66} ${H * 0.88} ${W * 0.84} ${H}Z`} fill="#e9dcc2" />
        {[[0.12, 0.88], [0.86, 0.9], [0.92, 0.86], [0.2, 0.93]].map(([x, y], i) => <g key={x} transform={at(x, 0.8, H * y)} {...st}>
          <path d="M0 0 V-46" fill="none" />
          {[0, 90, 180, 270].map((a) => <ellipse key={a} cy={-68} rx={13} ry={18} transform={`rotate(${a} 0 -46)`} fill={i % 2 ? "#ffc83d" : "#e53950"} />)}
          <circle cy={-46} r={12} fill="#fff1d6" />
        </g>)}
      </>;
    case "schoolyard":
      return <>
        <g transform={at(0.92, 1.2)}><Tree /></g>
        {ground}
        <g transform={at(0.46, Math.min(1.1, W / (u * 960)))} {...st} filter={CEL}>
          <rect x={-420} y={-470} width={840} height={470} fill="#e8836b" />
          <path d="M-456 -466 H456 L420 -530 H-420Z" fill="#7c5ce0" />
          <rect x={-120} y={-610} width={240} height={150} fill="#e8836b" />
          <path d="M-142 -600 L0 -694 L142 -600Z" fill="#7c5ce0" />
          <circle cy={-534} r={50} fill="#fff" /><path d="M0 -570 V-534 L26 -520" fill="none" />
          <path d="M0 -694 V-800" fill="none" strokeWidth={8} /><path d="M2 -800 L84 -776 L2 -750Z" fill="#3ddc97" />
          {[-310, -170, 170, 310].flatMap((x) => [-420, -240].map((y) => <g key={`${x}${y}`}><rect x={x - 54} y={y} width={108} height={118} fill="#a8dcff" /><path d={`M${x} ${y} V${y + 118} M${x - 54} ${y + 59} H${x + 54}`} fill="none" /></g>))}
          <rect x={-90} y={-220} width={180} height={220} fill="#8a5a3b" /><path d="M0 -220 V0" fill="none" />
        </g>
        <g transform={at(0.05)}><Fence from={-130} to={130} /></g>
        {[0, 1, 2, 3].map((i) => <rect key={i} x={W * 0.56 + i * 92 * u} y={H * 0.9} width={84 * u} height={70 * u} fill="none" stroke="#fff9df" strokeWidth={8 * u} />)}
      </>;
    case "street":
      return <>
        {streetHouses(W, u).map(({ x, wall, roof }) => <g key={x} transform={at(x, STREET_HOUSE, G - 12 * u)}><House wall={wall} roof={roof} /></g>)}
        <rect y={G - 12 * u} width={W} height={H * 0.075} fill="#cfd3da" stroke={INK} strokeWidth={5 * u} />
        <rect y={G - 12 * u + H * 0.075} width={W} height={H} fill="#5d6680" stroke={INK} strokeWidth={5 * u} />
        {[0.1, 0.36, 0.62, 0.88].map((x) => <rect key={x} x={W * x - 70 * u} y={H * 0.945} width={140 * u} height={16 * u} rx={5 * u} fill="#ffc83d" />)}
        <g transform={at(0.04, 1, G)}><Lamp /></g>
        <g transform={at(0.96, 1, G)}><Lamp /></g>
      </>;
    default:
      return null;
  }
};

/** What keeps shining after the picture has been darkened. */
const Lights: React.FC<{ type: string; W: number; H: number; u: number }> = ({ type, W, H, u }) => {
  const G = H * GROUND;
  const at = (x: number, s = 1, y = G) => `translate(${W * x} ${y}) scale(${u * s})`;
  if (type === "house_exterior") return <g transform={at(0.5, Math.min(1.25, W / (u * 900)))}><House lit /></g>;
  if (type === "street") return <>
    {streetHouses(W, u).map(({ x }) => <g key={x} transform={at(x, STREET_HOUSE, G - 12 * u)}><House lit /></g>)}
    <g transform={at(0.04)}><Lamp lit /></g><g transform={at(0.96)}><Lamp lit /></g>
  </>;
  if (type === "park") return <g transform={at(0.42, 0.85)}><Lamp lit /></g>;
  if (type === "living_room") return <>
    {[300, 215, 130].map((r) => <circle key={r} cx={W * 0.5} cy={265 * u} r={r * u} fill={GLOW} opacity={0.12} />)}
    <g transform={at(0.93)}><Lamp lit /></g>
  </>;
  return null;
};

export const StorySetting: React.FC<{ type: string; W: number; H: number; color?: string; color2?: string; time?: TimeOfDay }> = ({ type, W, H, color, color2, time = "day" }) => {
  const u = Math.min(W, H) / 1080;
  const indoors = type === "living_room";
  const [shadow, amount] = DARK[time];
  return <>
    <defs><CelFilter id="setCel" depth={15} opacity={0.2} /></defs>
    {indoors
      ? <LivingRoom W={W} H={H} u={u} time={time} wall={resolveColor(color, "#fff1d6")} floor={resolveColor(color2, "#c99a6d")} />
      : <><Sky W={W} H={H} u={u} time={time} color={color} /><Scene type={type} W={W} H={H} u={u} time={time} color={color} color2={color2} /></>}
    {amount > 0 && <rect width={W} height={H} fill={indoors ? ROOM_DARK : shadow} opacity={indoors ? amount * 0.66 : amount} />}
    {time === "night" && !indoors && <NightSky W={W} H={H} u={u} />}
    {time !== "day" && <Lights type={type} W={W} H={H} u={u} />}
  </>;
};
