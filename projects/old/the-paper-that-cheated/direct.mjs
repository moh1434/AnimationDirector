import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
const read=f=>JSON.parse(fs.readFileSync(path.join(dir,f),'utf8').replace(/^\uFEFF/,''));
const sb=read('storyboard.json'), a=read('build/analysis.json'), timeline=read('build/dialogue-timeline.json');
const actor=(who,pose='idle',expression='happy')=>({who,x:who==='benny'?.26:.73,y:.89,size:.52,pose,expression,facing:who==='benny'?'right':'left',enter:'none'});
const prop=(name,x,y,size,extra={})=>({name,x,y,size,at:0,enter:'none',motion:'none',face:false,...extra});
const book=(x=.5,y=.365,extra={})=>prop('race-book',x,y,.39,extra);
const paper=(x=.5,y=.3453,extra={})=>prop('race-paper',x,y,.29,extra);
const floor=()=>prop('drop-floor',.5,.55,.82,{zIndex:3});
const cast=(bpose='idle',bexp='happy',rpose='idle',rexp='happy')=>[actor('benny',bpose,bexp),actor('berry',rpose,rexp)];
const scene=(id,start,characters,props,extra={})=>({id,start,layout:'story',bg:{type:'classroom'},light:'warm',transition:'cut',characters,props,camera:{zoom:[1,1],drift:false},...extra});
const move=(at,duration,x,y,extra={})=>({at,duration,x,y,ease:'sine.inOut',...extra});
const act=(at,who,pose,expression,extra={})=>({at,who,pose,expression,...extra});
sb.cast={benny:{preset:'benny',name:'Benny'},berry:{preset:'berry',name:'Berry'}};
sb.duration=a.duration; sb.endHold=.65; sb.sfxDensity='sparse';sb.directedBy='codex';
sb.scenes=[
scene('equal-height-challenge',0,cast('present','proud','think','thinking'),[book(.28),paper(.72,.356),floor()],{
 actions:[act('clip:2','berry','think','confused',{emote:'question'}),act('clip:3','benny','point_up','proud')],
 texts:[{text:'Same height',style:'label',x:.5,y:.285,at:.15,out:'clip:3:end'}],
 camera:{zoom:[1,1.025],focus:{x:.5,y:.6},drift:false}
}),
scene('first-race', 'clip:4',cast('point_up','smug','idle','thinking'),[
 book(.28,.365,{move:[move(.12,.65,.28,.531,{ease:'power2.in'})]}),
 paper(.72,.356,{move:[move(.12,.36,.66,.395,{rotate:-9}),move(.48,.40,.75,.428,{rotate:10}),move(.88,.43,.68,.47,{rotate:-8}),move(1.31,.48,.72,.547,{rotate:0})]}),floor()],
 {actions:[act('clip:4','benny','point_up','smug'),act(1.8,'berry','present','happy')],sfx:[{at:.77,name:'thud'}]}),
scene('same-objects-new-test','clip:5',cast('cross','smug','present','happy'),[
 book(.28,.531,{move:[move('@book',.8,.5,.365)]}),
 paper(.72,.547,{move:[move('@paper',.65,.72,.33,{arc:.025}),move('clip:6',.8,.5,.3453)]}),floor()],
 {actions:[act('clip:6','benny','shrug','smug'),act('clip:6','berry','point_up','happy')]}),
scene('public-transport','clip:7',cast('shrug','laughing','present','determined'),[book(),paper(),floor()],{
 actions:[act('clip:8','berry','point_up','determined'),act('clip:8+0.8','benny','think','thinking')],
 camera:{zoom:[1.025,1.045],focus:{x:.5,y:.6},drift:false}
}),
scene('no-glue-no-tricks','clip:9',cast('point_up','determined','present','happy'),[book(),paper(),floor()],{
 actions:[act('clip:10','berry','present','happy'),act('clip:10+1.4','benny','idle','thinking')]
}),
scene('second-race','clip:10:end-0.06',cast('idle','surprised','idle','happy'),[
 book(.5,.365,{move:[move(.12,.65,.5,.531,{ease:'power2.in'})]}),
 paper(.5,.3453,{move:[move(.12,.65,.5,.5113,{ease:'power2.in'})]}),floor()],
 {actions:[act('clip:11','benny','celebrate','surprised',{emote:'exclaim'}),act('clip:11','berry','hips','proud')],sfx:[{at:.77,name:'thud'}]}),
scene('air-against-loose-paper','clip:12',cast('think','thinking','explain','happy'),[
 paper(.5,.395,{move:[move(.25,.6,.46,.415,{rotate:-6}),move(.9,.6,.54,.425,{rotate:6}),move(1.6,.55,.5,.435,{rotate:0})]}),
 prop('air-resistance',.5,.495,.25,{at:'@Air',enter:'grow'})],{
 texts:[{text:'Air resistance',style:'label',x:.5,y:.285,at:'@Air'}],actions:[act('clip:13','benny','shrug','confused')]
}),
scene('book-shields-paper','clip:14',cast('think','thinking','point_up','happy'),[
 book(.5,.416),paper(.5,.3963),prop('air-resistance',.5,.50,.25,{zIndex:3})],{
 texts:[{text:'Shielded',style:'label',x:.5,y:.285,at:'@shields'}],
 actions:[act('@shields','berry','point_up','happy'),act('@resistance','benny','idle','surprised')]
}),
scene('weight-wasnt-everything','clip:15',cast('think','thinking','idle','happy'),[book(.5,.416),paper(.5,.3963)],{
 actions:[act('clip:16','berry','point_up','happy',{emote:'idea'}),act('clip:16','benny','idle','happy')],
 camera:{zoom:[1,1.04],focus:{x:.5,y:.76},drift:false}
}),
scene('homework-lift','clip:17',cast('present','happy','hips','laughing'),[
 prop('backpack',.47,.80,.24,{zIndex:4}),book(.5,.416),paper(.5,.3963)],{
 actions:[act('@homework','benny','point_down','happy',{lookAt:{x:.7,y:.8}}),act('@too','berry','shrug','laughing')],
 camera:{zoom:[1.04,1.07],focus:{x:.5,y:.76},drift:false}
})
];
fs.writeFileSync(path.join(dir,'storyboard.json'),JSON.stringify(sb,null,2));
const notes=`# Direction notes\n\nSelected takes: Benny 1, Berry 1. Original takes unchanged; four line-boundary corrections are recorded in cut-corrections.json and each extracted line has a generation/provenance record. No Adobe upload.\n\n| Clips | Takeaway | Cause → change → result | Focal subject / trigger | Assets |\n|---|---|---|---|---|\n| 1–3 | Test Benny's claim | Same objects, equal height → prediction | Book and smaller sheet in classroom; Heavy / Always / heavier | race-book, race-paper |\n| 4 | Loose paper arrives late | Simultaneous release → book drops directly, sheet flutters → separate arrival times | Fixed view of both objects; Look | drop-floor |\n| 5–6 | Change arrangement only | Reuse fallen objects → Berry resets and places sheet on top | Same paper / Same book | Same objects, no substitutes |\n| 7–10 | Weight has not changed | Sheet rests on wider cover → challenge → no-glue agreement | Public transport joke, then watch | Persistent stacked geometry |\n| 11 | Sheet keeps up | Shared release → matched fall → shared arrival before reaction | It kept up | Identical motion for the stack |\n| 12–13 | Air affects exposed sheet | Upward arrows oppose loose sheet → slow flutter | Air / changed | air-resistance, schematic arrows |\n| 14 | Cover shields sheet | Arrows below book, sheet remains above → shielding | shields | Same book and sheet |\n| 15–16 | Weight alone is insufficient | Benny reconsiders → Berry agrees | light / Exactly | Same setting and cast |\n| 17 | Payoff | Benny looks at schoolbag → asks for a lift | homework | Existing backpack |\n\nThe demonstrations use illustrative drop distances, not measured acceleration. Thin horizontal artwork keeps a level closed book and flat sheet legible. Classroom and screen direction stay constant. Voice is never retimed. Two sparse landing sounds; mostly plain cuts. Review initial, midpoint, landing and exit frames of both falls, the paper placement, arrow direction, and the final gag.\n`;
fs.writeFileSync(path.join(dir,'build/direction-notes.md'),notes);
console.log(`Directed ${sb.scenes.length} scenes, ${sb.duration + sb.endHold}s.`);

