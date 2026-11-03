import React from "react";
import { LIFE_PROPS } from "./LifeProps";
import { LIFE_BACKGROUNDS } from "./LifeBackgrounds";
import { EVERYDAY_PROPS } from "./EverydayProps";
import { EVERYDAY_BACKGROUNDS } from "./EverydayBackgrounds";
import { Background } from "./Backgrounds";
import { PropArt } from "./Props";

export const AssetExpansionLibrary: React.FC<{page?: string; portrait?: boolean; batch?: number}> = ({page = "props", portrait = false, batch = 1}) => {
  const names = batch === 2 ? Object.keys(LIFE_PROPS) : [...Object.keys(EVERYDAY_PROPS), "book", "key"];
  return <div style={{width:1920, height:1080, background:"#fff9ed", color:"#1d1b20", fontFamily:"sans-serif", padding:40, boxSizing:"border-box"}}>
    <div style={{fontSize:36, fontWeight:700, marginBottom:24}}>{page === "props" ? (batch === 2 ? "Original props · medicine, travel, work, feelings and celebrations" : "Original props · book and key shown for style comparison") : `Original settings · ${portrait ? "vertical" : "wide"} framing`}</div>
    {page === "props" ? <div style={{display:"grid", gridTemplateColumns:"repeat(6, 1fr)", gap:16}}>{names.map(name=><div key={name} style={{background:"#fff",borderRadius:18, textAlign:"center",padding:12}}>
      <svg width={230} height={230} viewBox="-110 -110 220 220"><PropArt name={name}/></svg><div style={{fontSize:25}}>{name}</div>
    </div>)}</div> : <div style={{display:"grid",gridTemplateColumns:portrait ? `repeat(${batch === 2 ? 2 : 4}, 1fr)` : "repeat(2, 1fr)",gap:24}}>{(batch === 2 ? LIFE_BACKGROUNDS : EVERYDAY_BACKGROUNDS).map(name=>{
      const W=portrait ? 1080 : 1920, H=portrait ? 1920 : 1080;
      const scale=portrait ? 430/W : 740/W;
      return <div key={name} style={{margin:"0 auto"}}><div style={{position:"relative",width:W*scale,height:H*scale,overflow:"hidden",border:"2px solid #1d1b20",borderRadius:12}}><div style={{position:"absolute",width:W,height:H,transform:`scale(${scale})`,transformOrigin:"top left"}}><Background spec={{type:name}} W={W} H={H} t={0} frame={0}/></div></div><div style={{fontSize:25,marginTop:6,textAlign:"center"}}>{name}</div></div>;
    })}</div>}
  </div>;
};
