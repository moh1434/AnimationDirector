import React from "react";
import { INK, resolveColor } from "./theme";

/** Edge scenery leaves a quiet central stage and clear upper caption area. */
export const FarmBackground: React.FC<{W:number; H:number; color?:string; color2?:string}> = ({W,H,color,color2}) => {
  const u=Math.min(W,H)/1080;
  const line={stroke:INK,strokeWidth:5,strokeLinejoin:"round" as const,strokeLinecap:"round" as const};
  return <>
    <rect width={W} height={H} fill={resolveColor(color,"#dff4f5")}/>
    <path d={`M0 ${H*.74} Q${W*.18} ${H*.65} ${W*.36} ${H*.76} Q${W*.7} ${H*.68} ${W} ${H*.73} V${H} H0Z`} fill="#b8d99b"/>
    <path d={`M0 ${H*.84} H${W} V${H} H0Z`} fill={resolveColor(color2,"#efd28e")}/>
    <g transform={`translate(${W*.02} ${H*.84}) scale(${u})`} filter="url(#setCel)" {...line}>
      <path d="M0 0 V-160 L100 -239 L200 -160 V0Z" fill="#e53950"/>
      <path d="M-14 -155 L100 -249 L214 -155" fill="none" strokeWidth={10}/>
      <rect x={65} y={-102} width={70} height={102} fill="#fff9df"/>
      <path d="M65 -100 L135 0 M135 -100 L65 0" fill="none"/>
      <rect x={80} y={-181} width={40} height={35} rx={3} fill="#fff9df"/>
    </g>
    <g transform={`translate(${W*.98} ${H*.84}) scale(${u})`} filter="url(#setCel)" {...line}>
      <path d="M-185 0 V-118 M-105 0 V-118 M-25 0 V-118 M-203 -85 H0 M-203 -39 H0" fill="none" stroke="#bb8055" strokeWidth={12}/>
    </g>
    {[0,1].map(side=><g key={side} transform={`translate(${side ? W-55*u : 55*u} ${H*.98}) scale(${u})`} filter="url(#setCel)" {...line}>
      {[-28,22].map((x,i)=><g key={x} transform={`translate(${x} ${i ? -10 : 0})`} filter="url(#setCel)"><path d="M0 0 V-86" fill="none"/><path d="M0 -20 Q-43 -27 -34 -52 Q-7 -49 0 -20 M0 -47 Q29 -49 30 -76 Q6 -74 0 -47" fill="#3ddc97"/><ellipse cy={-85} rx={10} ry={23} fill="#ffc83d"/></g>)}
    </g>)}
  </>;
};
