import React from "react";
import type { Art } from "./Props";
import { INK } from "./theme";

// Original diagrams. State pairs deliberately share geometry so a cut preserves position.
const line = {stroke: INK, strokeWidth: 6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const};
const clay = "#e88851", sand = "#ffc83d", blue = "#3b8df0", green = "#3ddc97", cream = "#fff9df";
const Pot: React.FC<{cutaway?: boolean; color?: string}> = ({cutaway, color}) => <g {...line}>
  <path d="M-48 -68 C-48 -35 -84 -24 -84 21 Q-84 86 -42 86 H42 Q84 86 84 21 C84 -24 48 -35 48 -68Z" fill={color ?? clay}/>
  {cutaway && <><path d="M-34 -63 C-34 -26 -66 -16 -66 21 Q-66 68 -36 68 H36 Q66 68 66 21 C66 -16 34 -26 34 -63Z" fill={sand}/><path d="M-22 -61 C-22 -22 -51 -12 -51 22 Q-51 53 -29 53 H29 Q51 53 51 22 C51 -12 22 -22 22 -61Z" fill={cream}/></>}
  <rect x={-58} y={-83} width={116} height={20} rx={6} fill={color ?? clay}/>
</g>;
const Soil: React.FC<{roots?: boolean}> = ({roots}) => <g {...line}>
  <path d="M-86 -38 H86 V85 H-86Z" fill="#bb8055"/>
  <path d="M-86 31 Q-45 15 0 32 T86 31 V85 H-86Z" fill="#e8a451"/>
  <path d="M-86 -38 H86 V-16 Q43 -2 0 -16 T-86 -16Z" fill="#714832"/>
  {roots && <><path d="M0 -38 V65 M0 -13 L-32 10 L-48 43 M0 6 L31 27 L44 61 M-29 8 L-54 9 M30 26 L58 17 M0 35 L-22 57" stroke={cream} strokeWidth={5} fill="none"/><path d="M0 -38 V-74 M0 -47 Q-44 -43 -47 -77 Q-17 -89 0 -47 M0 -61 Q22 -94 48 -78 Q40 -48 0 -48" fill={green}/></>}
  {!roots && <path d="M-76 -39 L-48 -31 L-22 -39 L2 -30 L32 -39 L58 -30 L80 -39" fill="none"/>}
</g>;
const Water: React.FC<{level: number; color?: string}> = ({level, color}) => {
  const y = 73 - level * 140;
  return <g {...line}><rect x={-66} y={-84} width={132} height={170} rx={12} fill={cream}/>
    <path d={`M-57 ${y} Q-28 ${y-9} 0 ${y} T57 ${y} V72 Q57 77 52 77 H-52 Q-57 77 -57 72Z`} fill={color ?? blue} stroke="none"/>
    <path d={`M-57 ${y} Q-28 ${y-9} 0 ${y} T57 ${y}`} fill="none" strokeWidth={4}/>
    {[-52,-20,12,44].map(y=><path key={y} d={`M36 ${y} H51`} fill="none" strokeWidth={4}/>)}
  </g>;
};
const Thermometer: React.FC<{hot?: boolean; color?: string}> = ({hot, color}) => <g {...line}>
  <path d="M-25 28 V-63 A25 25 0 0 1 25 -63 V28 A35 35 0 1 1 -25 28Z" fill={cream}/>
  <path d={`M0 46 V${hot ? -62 : 4}`} stroke={color ?? (hot ? "#e53950" : blue)} strokeWidth={16}/>
  <circle cy={53} r={21} fill={color ?? (hot ? "#e53950" : blue)} stroke="none"/>
  {[-60,-29,2].map(y=><path key={y} d={`M38 ${y} H55`} fill="none" strokeWidth={5}/>)}
  {hot ? <path d="M-52 -61 L-65 -75 M-56 -31 H-76 M-49 -3 L-65 9" fill="none" stroke="#e53950"/> : <path d="M-66 -65 V-21 M-85 -54 L-47 -32 M-85 -32 L-47 -54" fill="none" stroke={blue} strokeWidth={5}/>}
</g>;

export const MECHANISM_PROPS: Record<string, Art> = {
  clay_pot: {aliases:["terracotta_pot"], face:{x:0,y:20,s:.42}, draw:(_,o)=><Pot color={o.color}/>},
  pot_cutaway: {aliases:["container_cutaway","pot_section"], draw:(_,o)=><Pot cutaway color={o.color}/>},
  soil_roots: {aliases:["root_system","roots"], draw:()=> <Soil roots/>},
  soil_bare: {aliases:["soil_layers","soil_section"], draw:()=> <Soil/>},
  water_low: {aliases:["low_water"], draw:(_,o)=><Water level={.2} color={o.color}/>},
  water_half: {aliases:["water_level"], draw:(_,o)=><Water level={.5} color={o.color}/>},
  water_full: {aliases:["full_water"], draw:(_,o)=><Water level={.9} color={o.color}/>},
  thermometer_cold: {aliases:["thermometer","cool_temperature"], draw:(_,o)=><Thermometer color={o.color}/>},
  thermometer_hot: {aliases:["hot_temperature"], draw:(_,o)=><Thermometer hot color={o.color}/>},
  heat_arrows: {aliases:["heat_flow","evaporation_arrows"], draw:(_,o)=><g {...line} fill="none" stroke={o.color ?? "#e53950"} strokeWidth={8}>{[-55,0,55].map(x=><g key={x} transform={`translate(${x} 0)`}><path d="M0 78 C-32 48 32 16 0 -15 C-22 -37 -15 -56 0 -75"/><path d="M-24 -66 L0 -82 L14 -57"/></g>)}</g>},
  wind_arrows: {aliases:["air_flow","wind_flow"], draw:(_,o)=><g {...line} fill="none" stroke={o.color ?? blue} strokeWidth={8}>{[-53,0,53].map(y=><g key={y} transform={`translate(0 ${y})`}><path d="M-83 7 Q-51 -14 -16 0 T76 0"/><path d="M60 -20 L86 0 L64 21"/></g>)}</g>},
};
