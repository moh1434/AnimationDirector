import React from "react";
import { MECHANISM_PROPS } from "./MechanismProps";
import { PropArt } from "./Props";
import { Background } from "./Backgrounds";

export const MechanismLibrary: React.FC<{page?:string}> = ({page="props"}) => <div style={{width:1920,height:1080,padding:48,boxSizing:"border-box",background:"#fff9ed",color:"#1d1b20",fontFamily:"sans-serif"}}>
  <h1 style={{fontSize:42,margin:"0 0 12px"}}>{page==="props" ? "Mechanisms · original flat illustrations" : "Farm · clear stage in both formats"}</h1>
  <p style={{fontSize:26,margin:"0 0 32px"}}>{page==="props" ? "Matching state pairs · 200-unit artwork · book shown for style comparison" : "Flat fills, edge scenery and a quiet upper area for captions"}</p>
  {page==="props" ? <div style={{display:"grid",gridTemplateColumns:"repeat(6, 1fr)",gap:20}}>{[...Object.keys(MECHANISM_PROPS),"book"].map(name=><div key={name} style={{background:"white",borderRadius:18,padding:16,textAlign:"center"}}>
    <svg width={245} height={265} viewBox="-105 -110 210 220"><PropArt name={name}/></svg><div style={{fontSize:25,marginBottom:14}}>{name}</div>
  </div>)}</div> : <div style={{display:"flex",gap:64,alignItems:"center",justifyContent:"center"}}>{[{W:1080,H:1920,s:.4},{W:1920,H:1080,s:.6}].map(({W,H,s})=><div key={W}><div style={{position:"relative",width:W*s,height:H*s,overflow:"hidden",border:"3px solid #1d1b20"}}><div style={{position:"absolute",width:W,height:H,transform:`scale(${s})`,transformOrigin:"top left"}}><Background spec={{type:"farm"}} W={W} H={H} t={0} frame={0}/></div></div><div style={{textAlign:"center",fontSize:26,marginTop:12}}>{W} × {H}</div></div>)}</div>}
</div>;
