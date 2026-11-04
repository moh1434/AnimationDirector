import React from "react";
import { INK, resolveColor } from "./theme";
export const STORY_BACKGROUNDS=["village","ruins","hilltop"] as const;
const line={stroke:INK,strokeWidth:5,strokeLinejoin:"round" as const,strokeLinecap:"round" as const};
const House: React.FC<{x:number;y:number;s:number;fill:string}> = ({x,y,s,fill})=><g transform={`translate(${x} ${y}) scale(${s})`} {...line}>
  <path d="M0 0 V-120 L75 -186 L150 -120 V0Z" fill={fill}/><path d="M-12 -116 L75 -193 L162 -116" fill="none" strokeWidth={9}/>
  <path d="M59 0 V-66 Q75 -87 91 -66 V0Z" fill="#714832"/><rect x={21} y={-100} width={27} height={30} rx={3} fill="#fff9df"/><rect x={105} y={-100} width={27} height={30} rx={3} fill="#fff9df"/>
</g>;
export const StoryBackground: React.FC<{type:string;W:number;H:number;color?:string;color2?:string}> = ({type,W,H,color,color2})=>{
 const u=Math.min(W,H)/1080, ground=H*.84;
 return <>
  <rect width={W} height={H} fill={resolveColor(color,type==="ruins"?"#e6edef":"#dff4f5")}/>
  <path d={`M0 ${H*.79} Q${W*.25} ${H*.65} ${W*.48} ${H*.78} Q${W*.78} ${H*.69} ${W} ${H*.77} V${H} H0Z`} fill={type==="ruins"?"#c9c4ae":"#b8d99b"}/>
  <path d={`M0 ${ground} H${W} V${H} H0Z`} fill={resolveColor(color2,type==="hilltop"?"#a3cf8c":"#efd5aa")}/>
  {type==="village" && <>
   <House x={-35*u} y={ground-25*u} s={u*.85} fill="#ffc83d"/>
   <House x={70*u} y={ground} s={u} fill="#e8a451"/>
   <House x={W-175*u} y={ground} s={u} fill="#82c9be"/>
   <path d={`M${W*.44} ${H} L${W*.49} ${ground} H${W*.53} L${W*.66} ${H}`} fill="#fff1d6"/>
  </>}
  {type==="ruins" && <g {...line}>
   <g transform={`translate(${25*u} ${ground}) scale(${u})`}>
    <path d="M0 0 V-270 L38 -270 L38 -235 L68 -235 L68 -191 L104 -201 L114 -158 H170 V0Z" fill="#c5a578"/>
    <path d="M54 0 V-94 Q84 -127 114 -94 V0" fill="#efd5aa"/><path d="M20 -224 H45 M103 -144 H150 M16 -57 H39 M56 -174 L70 -146 L59 -126" fill="none" strokeWidth={4}/>
   </g>
   <g transform={`translate(${W-190*u} ${ground}) scale(${u})`}>
    <path d="M0 0 V-119 H39 V-156 H67 V-219 H96 V-196 H160 V0Z" fill="#c5a578"/>
    <path d="M92 -157 H128 V-112 H92Z" fill="#e6edef"/><path d="M24 -84 H65 M105 -56 H146 M76 -23 L92 -49 L78 -70" fill="none" strokeWidth={4}/>
   </g>
   {[.06,.91].map((x,i)=><g key={x} transform={`translate(${W*x} ${H*.94}) scale(${u})`}><path d="M-40 0 L-27 -27 H15 L37 0Z" fill="#c5a578"/><path d={`M20 17 L32 -9 H${i?77:62} L83 17Z`} fill="#e8c797"/></g>)}
  </g>}
  {type==="hilltop" && <>
   <path d={`M${W*.62} ${ground} Q${W*.77} ${ground-170*u} ${W*.79} ${ground-340*u} H${W*.89} Q${W*.94} ${ground-140*u} ${W+20*u} ${ground}Z`} fill="#75b77b" stroke={INK} strokeWidth={5*u} strokeLinejoin="round"/>
   <House x={W*.84-67*u} y={ground-340*u} s={u*.9} fill="#fff1d6"/>
   <path d={`M${W*.78} ${ground} Q${W*.91} ${ground-100*u} ${W*.84} ${ground-180*u} Q${W*.79} ${ground-250*u} ${W*.84} ${ground-336*u}`} fill="none" stroke="#efd5aa" strokeWidth={20*u}/>
   <path d={`M0 ${ground} Q${W*.12} ${ground-135*u} ${W*.29} ${ground}`} fill="#86bd82"/>
  </>}
 </>;
};
