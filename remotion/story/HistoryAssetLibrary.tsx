import React from "react";
import {HISTORY_PROPS} from "./HistoryProps";
import {PropArt} from "./Props";
import {Character} from "./Character";
import {PRESETS} from "./theme";
export const HistoryAssetLibrary: React.FC = ()=><div style={{width:1920,height:1080,padding:40,boxSizing:"border-box",background:"#fff9ed",color:"#1d1b20",fontFamily:"sans-serif"}}>
 <h1 style={{fontSize:40,margin:"0 0 10px"}}>Characters, objects and history</h1>
 <p style={{fontSize:25,margin:"0 0 26px"}}>Original flat illustrations · reusable police character · existing bomb included</p>
 <div style={{display:"grid",gridTemplateColumns:"repeat(5, 1fr)",gap:20}}>{["monster","gun","bomb","policeman","visa_card",...Object.keys(HISTORY_PROPS).filter(n=>!["monster","gun","visa_card"].includes(n))].map(name=><div key={name} style={{background:"white",borderRadius:18,padding:12,textAlign:"center"}}>
 {name==="policeman"?<svg width={280} height={310} viewBox="-310 -760 620 800"><Character look={PRESETS.policeman} pose="idle" expression="happy" t={0} frame={0} fps={60}/></svg>:<svg width={280} height={310} viewBox="-120 -125 240 250"><PropArt name={name}/></svg>}
 <div style={{fontSize:25,marginBottom:12}}>{name}</div>
 </div>)}</div>
</div>;
