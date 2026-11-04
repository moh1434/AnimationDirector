import React from "react";
import { STORY_PROPS } from "./StoryProps";
import { PropArt } from "./Props";
import { Background } from "./Backgrounds";

export const StoryAssetLibrary: React.FC<{page?:string}> = ({page="props"})=><div style={{width:1920,height:1080,padding:48,boxSizing:"border-box",background:"#fff9ed",color:"#1d1b20",fontFamily:"sans-serif"}}>
 <h1 style={{fontSize:42,margin:"0 0 12px"}}>{page==="props"?"Story props · animals and transport":`${page[0].toUpperCase()+page.slice(1)} · portrait and landscape`}</h1>
 <p style={{fontSize:26,margin:"0 0 32px"}}>{page==="props"?"Original flat illustrations · book shown for style comparison":"Quiet central stage · flat colour · scenery arranged for each frame"}</p>
 {page==="props"?<div style={{display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:24}}>{[...Object.keys(STORY_PROPS),"book"].map(name=><div key={name} style={{background:"white",borderRadius:18,padding:12,textAlign:"center"}}><svg width={290} height={285} viewBox="-105 -105 210 210"><PropArt name={name}/></svg><div style={{fontSize:28,marginBottom:12}}>{name}</div></div>)}</div>:<div style={{display:"flex",gap:64,alignItems:"center",justifyContent:"center"}}>{[{W:1080,H:1920,s:.4},{W:1920,H:1080,s:.6}].map(({W,H,s})=><div key={W}><div style={{position:"relative",width:W*s,height:H*s,overflow:"hidden",border:"3px solid #1d1b20"}}><div style={{position:"absolute",width:W,height:H,transform:`scale(${s})`,transformOrigin:"top left"}}><Background spec={{type:page}} W={W} H={H} t={0} frame={0}/></div></div><div style={{textAlign:"center",fontSize:26,marginTop:12}}>{W} × {H}</div></div>)}</div>}
</div>;
