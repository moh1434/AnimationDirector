import React from "react";
import type { Art } from "./Props";
import { INK } from "./theme";

const line = {stroke:INK,strokeWidth:6,strokeLinecap:"round" as const,strokeLinejoin:"round" as const};
const cream="#fff9df", brown="#bb8055", dark="#714832", blue="#3b8df0";
export const STORY_PROPS: Record<string,Art> = {
  horse: {aliases:["pony","stallion"],face:{x:57,y:-45,s:.15},draw:(_,o)=><g {...line}>
    <path d="M-62 -17 Q-89 -25 -87 21 L-78 36 L-69 14Z" fill={o.color2??dark}/>
    <path d="M-47 18 L-39 78 H-23 L-20 14 M25 12 L37 78 H53 L44 7" fill={o.color2??dark}/>
    <path d="M-58 -17 Q-23 -32 12 -19 L27 -54 L37 -78 L45 -59 L54 -83 L64 -62 L84 -41 Q94 -23 76 -18 L51 -22 L42 13 Q28 32 -7 28 L-34 23 L-45 79 H-61 L-55 15 Q-70 3 -58 -17Z" fill={o.color??brown}/>
    <path d="M12 -18 L27 -54 L37 -78 L30 -37 L23 -8" fill={o.color2??dark}/>
    <path d="M25 20 L20 79 H36 L43 11" fill={o.color??brown}/>
    <path d="M-62 80 H-45 M-39 80 H-24 M20 80 H36 M38 80 H53" fill="none" strokeWidth={9}/>
    <circle cx={62} cy={-45} r={4} fill={INK} stroke="none"/><circle cx={81} cy={-29} r={3} fill={INK} stroke="none"/>
  </g>},
  cart: {aliases:["wagon","handcart"],face:{x:-9,y:-8,s:.28},draw:(_,o)=><g {...line}>
    <path d="M42 16 L89 -23 M-63 17 H58" fill="none" strokeWidth={9}/>
    <path d="M-82 -57 H57 L44 25 H-69Z" fill={o.color??"#e8a451"}/>
    <path d="M-77 -31 H52 M-73 -5 H48 M-45 -54 V23 M17 -54 V23" fill="none" strokeWidth={4}/>
    {[-47,28].map(x=><g key={x}><circle cx={x} cy={48} r={31} fill={o.color2??brown}/><circle cx={x} cy={48} r={7} fill={cream}/><path d={`M${x} 18 V78 M${x-30} 48 H${x+30}`} fill="none" strokeWidth={4}/></g>)}
  </g>},
  tractor: {aliases:["farm_tractor"],face:{x:43,y:8,s:.2},draw:(_,o)=><g {...line}>
    <path d="M-65 30 V-70 H-13 V-16 H65 Q80 -16 80 0 V34Z" fill={o.color??"#3ddc97"}/>
    <path d="M-57 -62 H-22 V-16 H-57Z" fill="#caeafa"/>
    <path d="M-76 -73 H-4 M43 -18 V-60 H53" fill="none" strokeWidth={9}/>
    <path d="M69 -5 V20 M-5 32 H85" fill="none"/>
    <circle cx={-42} cy={44} r={39} fill={INK}/><circle cx={-42} cy={44} r={22} fill={o.color2??"#ffc83d"}/>
    <circle cx={61} cy={56} r={27} fill={INK}/><circle cx={61} cy={56} r={13} fill={o.color2??"#ffc83d"}/>
  </g>},
  pigeon: {aliases:["carrier_pigeon"],face:{x:44,y:-45,s:.16},draw:(_,o)=><g {...line}>
    <path d="M-10 58 V81 M26 52 V81 M-24 83 H2 M14 83 H40" fill="none" stroke="#e88851"/>
    <path d="M-43 18 L-87 39 L-77 55 L-31 49" fill={o.color2??"#6a35d6"}/>
    <path d="M-51 12 Q-42 -15 5 -15 L17 -49 Q15 -79 44 -81 Q76 -82 77 -54 Q80 -30 55 -22 L46 14 Q42 59 -4 61 Q-53 59 -51 12Z" fill={o.color??"#b0bec5"}/>
    <path d="M18 -35 Q36 -16 61 -27 L54 -9 Q32 1 12 -13Z" fill={o.color2??"#6a35d6"}/>
    <path d="M-33 13 Q-12 -5 24 9 Q17 42 -20 43 Q-40 38 -33 13Z" fill={o.color2??"#6a35d6"}/>
    <path d="M75 -54 L92 -43 L75 -37" fill="#ffc83d"/>
    <circle cx={54} cy={-56} r={5} fill={INK} stroke="none"/>
  </g>},
  bat: {aliases:["flying_bat"],face:{x:0,y:5,s:.23},draw:(_,o)=><g {...line}>
    <path d="M-17 -9 Q-49 -43 -88 -66 Q-69 -12 -89 17 Q-57 0 -51 37 Q-24 21 -12 60 L0 42 L12 60 Q24 21 51 37 Q57 0 89 17 Q69 -12 88 -66 Q49 -43 17 -9Z" fill={o.color??"#6a35d6"}/>
    <path d="M-19 0 L-75 -48 M-19 0 L-51 37 M19 0 L75 -48 M19 0 L51 37" fill="none" strokeWidth={4}/>
    <path d="M-21 -17 L-25 -51 L-7 -32 H7 L25 -51 L21 -17 Q39 44 0 65 Q-39 44 -21 -17Z" fill={o.color2??"#b0bec5"}/>
    <circle cx={-9} cy={-6} r={4} fill={INK} stroke="none"/><circle cx={9} cy={-6} r={4} fill={INK} stroke="none"/>
    <path d="M-8 13 Q0 20 8 13" fill="none" strokeWidth={4}/>
  </g>},
};
