import React from "react";
import { INK, resolveColor } from "./theme";

export const EVERYDAY_BACKGROUNDS = ["forest", "garden", "kitchen", "workshop"] as const;

/** Quiet central stage; scenery scales with the shorter edge in either format. */
export const EverydayBackground: React.FC<{type: string; W: number; H: number; color?: string; color2?: string}> = ({type, W, H, color, color2}) => {
  const u = Math.min(W, H) / 1080;
  const line = {stroke: INK, strokeWidth: 5 * u, strokeLinejoin: "round" as const, strokeLinecap: "round" as const};
  const outdoor = type === "forest" || type === "garden";
  const wall = resolveColor(color, outdoor ? "#e3f5de" : type === "kitchen" ? "#fff1d6" : "#e8e5f5");
  const floor = resolveColor(color2, outdoor ? "#9edb9c" : "#d8b99a");
  return <>
    <rect width={W} height={H} fill={wall}/>
    <path d={`M0 ${H*.83} H${W} V${H} H0Z`} fill={floor}/>
    <path d={`M0 ${H*.83} H${W}`} {...line}/>
    {type === "forest" && [0, 1].map(side => <g key={side} transform={`translate(${side ? W : 0} ${H*.83}) scale(${u})`} filter="url(#setCel)" stroke={INK} strokeWidth={5} strokeLinejoin="round">
      <path d="M-39 0 L-27 -360 H27 L39 0Z" fill="#ba885b"/>
      <path d="M-162 -316 Q-200 -407 -105 -435 Q-140 -532 -37 -548 Q12 -625 70 -541 Q176 -552 155 -455 Q230 -376 137 -330Z" fill="#52b882"/>
      <path d="M-145 0 Q-170 -84 -92 -78 Q-39 -128 0 -66 Q78 -108 105 0Z" fill="#3d986d"/>
    </g>)}
    {type === "garden" && <>
      <g {...line} fill="#fff9df">{[0,1].map(side => <g key={side} transform={`translate(${side ? W : 0} ${H*.83}) scale(${u})`} filter="url(#setCel)">
        {[-180,-120,-60,0,60,120,180].map(x=><path key={x} d={`M${x-18} 0 V-139 L${x} -161 L${x+18} -139 V0Z`}/>)}
        <path d="M-208 -50 H208 M-208 -110 H208" fill="none"/>
      </g>)}</g>
      {[.07,.93].map((x,i)=><g key={x} transform={`translate(${W*x} ${H*.93}) scale(${u})`} filter="url(#setCel)" stroke={INK} strokeWidth={5}>
        <path d="M0 0 V-83 M0 -22 Q-48 -21 -39 -53 Q-7 -54 0 -22" fill="#3ddc97"/>
        {[0,90,180,270].map(a=><ellipse key={a} cx={0} cy={-103} rx={16} ry={23} transform={`rotate(${a} 0 -80)`} fill={i ? "#ffc83d" : "#e53950"}/>)}
        <circle cy={-80} r={16} fill="#fff1d6"/>
      </g>)}
    </>}
    {type === "kitchen" && <g {...line}>
      <g transform={`translate(0 ${H*.83}) scale(${u})`} filter="url(#setCel)">
        <rect x={-15} y={-245} width={245} height={245} rx={8} fill="#82c9be"/>
        <rect x={-15} y={-265} width={260} height={25} rx={5} fill="#fff9df"/>
        <path d="M106 -238 V0 M78 -185 V-150 M136 -185 V-150" fill="none"/>
        <path d="M50 -267 V-300 Q50 -329 80 -329 Q108 -329 108 -306" fill="none"/>
      </g>
      <g transform={`translate(${W} ${H*.83}) scale(${u})`} filter="url(#setCel)">
        <rect x={-209} y={-245} width={225} height={245} rx={8} fill="#fff9df"/>
        <rect x={-209} y={-265} width={225} height={25} rx={5} fill="#82c9be"/>
        <rect x={-181} y={-168} width={157} height={132} rx={12} fill="#a4c4ce"/>
        <path d="M-158 -145 H-48 M-159 -273 H-58" fill="none"/>
        {[-164,-102,-40].map(x=><circle key={x} cx={x} cy={-209} r={10} fill="#ffc83d"/>)}
      </g>
    </g>}
    {type === "workshop" && <g {...line}>
      {[0,1].map(side=><g key={side} transform={`translate(${side ? W : 0} ${H*.83}) scale(${u})`} filter="url(#setCel)">
        <path d={`M${side ? -228 : 20} 0 V-185 M${side ? -28 : 220} 0 V-185`} fill="none" strokeWidth={14}/>
        <rect x={side ? -250 : -10} y={-215} width={260} height={30} rx={6} fill="#e8a451"/>
        {side ? <><path d="M-185 -215 V-277 H-55 V-215" fill="#e53950"/><path d="M-144 -277 V-298 H-96 V-277 M-185 -245 H-55" fill="none"/><rect x={-132} y={-256} width={24} height={23} rx={3} fill="#ffc83d"/></> : <><path d="M30 -215 V-254 H164 V-215 M43 -254 V-285 H185 V-254" fill="#fff1d6"/><path d="M65 -280 V-258 M135 -247 V-220" fill="none"/></>}
      </g>)}
    </g>}
  </>;
};
