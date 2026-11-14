import React from "react";
import { INK, resolveColor } from "./theme";

export const LIFE_BACKGROUNDS = ["office", "airport"] as const;
export const LifeBackground: React.FC<{type:string; W:number; H:number; color?:string; color2?:string}> = ({type,W,H,color,color2}) => {
  const u=Math.min(W,H)/1080;
  const st={stroke:INK,strokeWidth:5,strokeLinecap:"round" as const,strokeLinejoin:"round" as const};
  return <>
    <rect width={W} height={H} fill={resolveColor(color,type==="office"?"#e3f1f7":"#e7f3f0")}/>
    <path d={`M0 ${H*.83} H${W} V${H} H0Z`} fill={resolveColor(color2,type==="office"?"#d9c0a8":"#c0d6dc")}/>
    <path d={`M0 ${H*.83} H${W}`} stroke={INK} strokeWidth={5*u}/>
    {type==="office" ? <>
      <g transform={`translate(0 ${H*.83}) scale(${u})`} filter="url(#setCel)" {...st}>
        <rect x={-15} y={-570} width={205} height={190} rx={8} fill="#fff9df"/>
        <rect x={2} y={-553} width={171} height={156} fill="#aedcf3"/>
        <path d="M87 -553 V-397 M2 -475 H173" fill="none"/>
        <path d="M20 0 V-209 M225 0 V-209" strokeWidth={12} fill="none"/>
        <rect x={-12} y={-226} width={260} height={23} rx={5} fill="#e8a451"/>
        <path d="M105 -228 V-255 M65 -228 H145" fill="none"/>
        <rect x={35} y={-343} width={140} height={89} rx={8} fill="#b0bec5"/>
        <rect x={46} y={-332} width={118} height={66} rx={3} fill="#3b8df0"/>
      </g>
      <g transform={`translate(${W} ${H*.83}) scale(${u})`} filter="url(#setCel)" {...st}>
        <rect x={-207} y={-330} width={220} height={330} rx={8} fill="#fff9df"/>
        {[-316,-213,-110].map(y=><g key={y}><rect x={-193} y={y} width={193} height={91} rx={3} fill="#b0bec5"/><path d={`M-117 ${y+28} H-76`} fill="none"/></g>)}
        <path d="M-160 -331 L-170 -393 H-99 L-109 -331Z" fill="#ffc83d"/>
        <path d="M-135 -395 V-470 M-135 -425 Q-185 -422 -178 -460 Q-135 -466 -135 -425 M-135 -449 Q-134 -497 -90 -485 Q-88 -450 -135 -449" fill="#3ddc97"/>
      </g>
    </> : <>
      <g transform={`translate(0 ${H*.83}) scale(${u})`} filter="url(#setCel)" {...st}>
        <rect x={-20} y={-585} width={260} height={320} rx={8} fill="#fff9df"/>
        <rect x={-8} y={-572} width={235} height={294} fill="#aedcf3"/>
        <path d="M-8 -348 H227 M110 -572 V-278" fill="none"/>
        <path d="M20 -425 L78 -434 L104 -474 H122 L115 -434 L170 -423 L176 -410 L112 -412 L119 -387 H104 L79 -412 H20Z" fill="#fff9df"/>
        <path d="M29 0 V-100 M205 0 V-100" strokeWidth={12} fill="none"/>
        <rect x={-10} y={-193} width={102} height={78} rx={12} fill="#3b8df0"/>
        <rect x={106} y={-193} width={102} height={78} rx={12} fill="#3b8df0"/>
        <rect x={-15} y={-115} width={238} height={23} rx={8} fill="#b0bec5"/>
      </g>
      <g transform={`translate(${W} ${H*.83}) scale(${u})`} filter="url(#setCel)" {...st}>
        <rect x={-222} y={-252} width={237} height={252} rx={8} fill="#3b8df0"/>
        <rect x={-237} y={-273} width={252} height={24} rx={5} fill="#fff9df"/>
        <path d="M-168 -274 V-309 M-194 -274 H-143" fill="none"/>
        <rect x={-213} y={-364} width={92} height={57} rx={6} fill="#b0bec5"/>
        <rect x={-210} y={-540} width={225} height={100} rx={10} fill="#fff9df"/>
        <path d="M-173 -490 H-39 M-66 -515 L-39 -490 L-66 -465" fill="none" strokeWidth={9}/>
      </g>
    </>}
  </>;
};
