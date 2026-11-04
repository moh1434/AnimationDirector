import React from "react";
import type {Art} from "./Props";
import {INK} from "./theme";
const line={stroke:INK,strokeWidth:6,strokeLinecap:"round" as const,strokeLinejoin:"round" as const};
const gold="#ffc83d", cream="#fff9df", clay="#e88851", grey="#b0bec5";
export const HISTORY_PROPS: Record<string,Art>={
 monster:{aliases:["creature","cartoon_monster"],face:{x:0,y:-18,s:.4},draw:(_,o)=><g {...line}>
  <path d="M-45 -43 L-67 -83 L-29 -63 M45 -43 L67 -83 L29 -63" fill={gold}/>
  <path d="M-48 -14 Q-94 -7 -88 34 L-71 40 L-57 16 M48 -14 Q94 -7 88 34 L71 40 L57 16" fill={o.color??"#3ddc97"}/>
  <path d="M-44 45 L-55 82 H-17 L-12 55 M44 45 L55 82 H17 L12 55" fill={o.color??"#3ddc97"}/>
  <path d="M-59 -31 Q-64 -70 0 -70 Q64 -70 59 -31 L65 25 Q65 66 0 66 Q-65 66 -65 25Z" fill={o.color??"#3ddc97"}/>
  <ellipse cy={36} rx={28} ry={19} fill={o.color2??cream} stroke="none"/>
  <circle cy={-23} r={24} fill="white"/><circle cy={-23} r={10} fill={INK} stroke="none"/>
  <path d="M-22 9 Q0 24 22 9" fill="none" strokeWidth={4}/><path d="M-15 14 L-10 25 L-4 18" fill="white" strokeWidth={3}/>
 </g>},
 gun:{aliases:["pistol","handgun"],face:{x:24,y:-27,s:.2},draw:(_,o)=><g {...line}>
  <path d="M-85 -55 H83 V-19 H13 L-3 -5 H-27 L-39 71 H-75 L-56 -16 H-85Z" fill={o.color??grey}/>
  <path d="M-53 -13 H-24 L-38 68 H-73Z" fill={o.color2??"#714832"}/>
  <path d="M-25 -9 H13 V12 Q8 28 -27 21 M-8 -9 V8" fill="none"/>
  <path d="M-65 -43 V-28 M-50 -43 V-28 M-34 -43 V-28 M66 -57 V-65 M-69 -57 V-65" fill="none" strokeWidth={4}/>
 </g>},
 visa_card:{aliases:["visa_payment_card"],face:{x:-35,y:24,s:.22},draw:(_,o)=><g {...line}>
  <rect x={-89} y={-58} width={178} height={116} rx={14} fill={o.color??"#3b8df0"}/>
  <rect x={-67} y={-34} width={35} height={29} rx={5} fill={gold}/><path d="M-67 -20 H-32 M-50 -34 V-5" fill="none" strokeWidth={3}/>
  <path d="M-65 17 H-48 M-33 17 H-16 M-1 17 H16 M31 17 H48 M-65 38 H-28" stroke={cream} strokeWidth={5}/>
  <text x={74} y={45} textAnchor="end" fill="white" stroke="none" fontFamily="Arial, sans-serif" fontSize={27} fontWeight={700}>VISA</text>
 </g>},
 amphora:{aliases:["ancient_vase"],face:{x:0,y:22,s:.36},draw:(_,o)=><g {...line}>
  <path d="M-33 -47 Q-89 -82 -83 -24 Q-78 7 -46 19 M33 -47 Q89 -82 83 -24 Q78 7 46 19" fill="none" stroke={INK} strokeWidth={14}/>
  <path d="M-33 -47 Q-89 -82 -83 -24 Q-78 7 -46 19 M33 -47 Q89 -82 83 -24 Q78 7 46 19" fill="none" stroke={o.color??clay} strokeWidth={7}/>
  <path d="M-25 -72 V-42 Q-66 -19 -53 25 Q-44 58 -13 70 V82 H13 V70 Q44 58 53 25 Q66 -19 25 -42 V-72Z" fill={o.color??clay}/>
  <path d="M-34 -84 H34 V-69 H-34Z" fill={gold}/><path d="M-53 -2 H53 M-45 38 H45" fill="none" stroke={o.color2??"#714832"} strokeWidth={10}/>
 </g>},
 ancient_column:{aliases:["stone_column","classical_column"],draw:(_,o)=><g {...line}>
  <path d="M-40 -57 H40 L46 63 H-46Z" fill={o.color??cream}/><path d="M-23 -42 V51 M0 -42 V51 M23 -42 V51" fill="none" strokeWidth={4}/>
  <path d="M-57 -67 H57 V-50 H-57Z M-60 63 H60 V82 H-60Z" fill={o.color2??"#e8c797"}/>
  <rect x={-68} y={-86} width={136} height={19} rx={4} fill={o.color??cream}/>
 </g>},
 chariot:{aliases:["ancient_chariot"],face:{x:-22,y:-15,s:.25},draw:(_,o)=><g {...line}>
  <path d="M10 26 H73 L89 2 M-62 28 V-53 Q-62 -74 -41 -74 H18 V19 H46" fill="none" strokeWidth={9}/>
  <path d="M-63 -38 H21 V29 H-63Z" fill={o.color??clay}/><path d="M-47 -24 H5 V12 H-47Z" fill={o.color2??gold}/>
  <circle cx={-21} cy={43} r={40} fill={cream}/>{[0,45,90,135].map(a=><path key={a} d="M-59 43 H17" transform={`rotate(${a} -21 43)`} fill="none" strokeWidth={4}/>)}<circle cx={-21} cy={43} r={9} fill={gold}/>
 </g>},
 ancient_helmet:{aliases:["bronze_helmet"],draw:(_,o)=><g {...line}>
  <path d="M-49 -49 Q-41 -87 20 -87 H58 V-63 Q5 -73 -13 -43Z" fill={o.color2??"#e53950"}/>
  <path d="M-65 12 V-16 Q-61 -63 0 -62 Q61 -63 65 -16 V72 H31 L19 17 H-19 L-31 72 H-65Z" fill={o.color??gold}/>
  <path d="M-52 -1 H-17 V12 H-52Z M17 -1 H52 V12 H17Z" fill={INK}/><path d="M-9 -13 V36 H9 V-13" fill={o.color??gold}/>
 </g>},
 sundial:{aliases:["sun_dial"],draw:(_,o)=><g {...line}>
  <ellipse cy={35} rx={87} ry={49} fill={o.color??"#e8c797"}/><ellipse cy={22} rx={87} ry={49} fill={o.color2??cream}/>
  <path d="M0 23 L-53 43 L-19 12Z" fill="#b0bec5" stroke="none"/>
  <path d="M0 23 V-74 L40 23Z" fill={gold}/>
  <path d="M-66 20 L-53 20 M-48 -4 L-39 4 M-60 43 L-49 37 M0 57 V47 M58 42 L48 36 M65 18 H54" fill="none" strokeWidth={4}/>
 </g>},
};
