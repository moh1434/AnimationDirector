import {readFileSync,writeFileSync} from 'node:fs';
const dir=new URL('./',import.meta.url);
const read=(p)=>JSON.parse(readFileSync(new URL(p,dir),'utf8').replace(/^\uFEFF/,''));
const sb=read('storyboard.json');
const actor=(who,x,pose='idle',expression='happy',extra={})=>({who,x,y:.81,size:.49,pose,expression,facing:x>.5?'left':'right',enter:'none',...extra});
const prop=(name,x,y,size,extra={})=>({name,x,y,size,at:0,anchor:'bottom',enter:'none',motion:'none',face:false,...extra});
const door=(open=false,extra={})=>prop(open?'bench-door-open':'bench-door-ajar',.52,.815,.64,{zIndex:3,...extra});
const bench=(extra={})=>prop('story-bench',.52,.84,.66,{zIndex:4,...extra});
const cast=()=>[actor('berry',.19,'present'),actor('benny',.49,'hold','determined'),actor('cherry',.82,'idle')];
const cam=(zoom=1.28)=>({zoom:[zoom,zoom+.025],focus:{x:.5,y:.81},drift:false});
const shot=(id,clip,characters=cast(),props=[door(),bench()],extra={})=>({id,start:clip===1?0:`clip:${clip}`,layout:'story',bg:{type:'room',color:'#f6dfba',color2:'#c99668'},light:'warm',transition:'cut',characters,props,camera:cam(),...extra});
const reaction=(clip,on,zoom=1.7)=>({at:`clip:${clip}`,on,zoom,duration:0});
const action=(clip,who,pose,expression)=>({at:`clip:${clip}`,who,pose,expression});
sb.directedBy='codex';sb.endHold=1.8;sb.sfxDensity='sparse';
sb.cast={benny:{preset:'benny',name:'Benny'},berry:{preset:'berry',name:'Berry'},cherry:{preset:'cherry',name:'Cherry'}};
sb.scenes=[
 shot('the-stubborn-bench',1,cast(),[door(),bench({move:[{at:.35,duration:.45,x:.55,ease:'power2.out'},{at:1.05,duration:.4,x:.52,ease:'sine.inOut'}]})],{
  camera:{...cam(1.28),moves:[reaction(2,'berry'),reaction(3,'benny')]},
  actions:[action(2,'berry','present','happy'),action(3,'benny','cross','proud')]}),
 shot('before-sunset',4,cast(),[door(),bench()],{
  camera:{...cam(1.24),moves:[reaction(5,'benny',1.6)]},
  actions:[action(4,'cherry','shrug','curious'),action(5,'benny','point','proud')]}),
 shot('stay-door',6,cast(),[door(true,{out:'clip:7'}),door(false,{at:'clip:7'}),bench()],{
  camera:{...cam(1.25),moves:[reaction(8,'benny',1.65)]},
  actions:[action(6,'benny','point','determined'),action(7,'berry','think','confused'),action(8,'benny','hips','determined')]}),
 shot('out-of-arms',9,[actor('berry',.19,'think'),actor('benny',.49,'hold','worried',{move:[{at:.15,duration:.5,x:.55,rotate:8,ease:'sine.inOut'}]}),actor('cherry',.82,'point','smug')],[door(true),bench({rotate:-5})],{
  camera:{...cam(1.26),moves:[reaction(10,'benny',1.75),reaction(11,'berry',1.75)]},
  actions:[action(10,'benny','think','determined'),action(11,'berry','scared','worried')]}),
 shot('what-benny-wanted',12,[actor('berry',.19,'idle','worried'),actor('benny',.49,'sit','sad'),actor('cherry',.82,'idle','happy')],[door(),bench()],{
  camera:{zoom:[1.6,1.7],on:'benny',drift:false}}),
 shot('still-a-lovely-bench',13,[actor('berry',.19,'idle','happy'),actor('benny',.49,'sit','sad'),actor('cherry',.82,'present','happy')],[door(),bench()],{
  camera:{...cam(1.25),moves:[reaction(14,'benny',1.65),reaction(15,'berry',1.65),reaction(16,'benny',1.65)]},
  actions:[action(15,'berry','present','happy'),action(16,'benny','shrug','sad')]}),
 shot('a-free-hand',17,[actor('berry',.21,'hold','happy',{holding:'story-watering-can',move:[{at:.1,duration:1.4,x:.58,ease:'sine.inOut'}]}),actor('benny',.41,'sit','thinking'),actor('cherry',.83,'point','happy')],[door(true),bench({x:.4})],{
  camera:{...cam(1.18),moves:[reaction(18,'berry',1.55)]},actions:[action(17,'benny','think','thinking')]}),
 shot('together-lift',19,[actor('berry',.82,'point','happy'),actor('benny',.25,'hold','determined',{move:[{at:'clip:21+0.25',until:'clip:22-0.1',x:.43,y:.79,ease:'sine.inOut'}]}),actor('cherry',.68,'hold','determined',{move:[{at:'clip:21+0.25',until:'clip:22-0.1',x:.86,y:.79,ease:'sine.inOut'}]})],[door(true),bench({x:.465,move:[{at:'clip:21+0.25',until:'clip:22-0.1',x:.645,y:.81,ease:'sine.inOut'}]})],{
  camera:{...cam(1.15),moves:[{at:'clip:21',zoom:1.08,focus:{x:.58,y:.82},duration:.4}]},
  actions:[action(19,'benny','present','happy'),action(20,'cherry','hold','determined'),action(21,'benny','hold','determined')]}),
 shot('better-with-people',22,[actor('berry',.25,'sit','happy'),actor('benny',.5,'sit','happy'),actor('cherry',.75,'sit','happy')],[bench({x:.5,y:.84,size:.8})],{
  bg:{type:'garden',color:'#efb1a1',color2:'#a7b985'},light:'dusk',camera:cam(1.3),
  actions:[action(23,'benny','sit','happy')]})
];
// Expression names are renderer vocabulary; curiosity is conveyed by a thinking face.
for(const s of sb.scenes) for(const a of s.actions??[]) if(a.expression==='curious') a.expression='thinking';
// Keep the architectural frame below the caption band even during reaction shots.
for(const s of sb.scenes){
 for(const c of s.characters){if(c.x===.19)c.x=.25;if(c.x===.82)c.x=.75;}
 const camera=s.camera;
 camera.zoom=camera.zoom.map(z=>Math.min(z,1.3));
 delete camera.on; camera.focus={x:.5,y:.82};
 for(const m of camera.moves??[]){delete m.on;m.focus={x:.5,y:.82};m.zoom=Math.min(m.zoom??1.3,1.3);}
}
const passing=sb.scenes.find(s=>s.id==='a-free-hand');
const awkward=sb.scenes.find(s=>s.id==='out-of-arms');
awkward.characters.find(c=>c.who==='benny').move[0].x=.47;
awkward.characters.find(c=>c.who==='benny').move[0].rotate=2;
passing.characters=[actor('cherry',.23,'hold','happy'),actor('benny',.48,'sit','thinking'),actor('berry',.67,'hold','happy',{holding:'story-watering-can',move:[{at:.1,duration:1.4,x:.76,ease:'sine.inOut'}]})];
passing.props=[door(true),bench({x:.46})];
passing.camera=cam(1.12);
const lift=sb.scenes.find(s=>s.id==='together-lift');
lift.characters[0].x=.20;
lift.characters[1].x=.44;lift.characters[1].move[0].x=.49;
lift.characters[2].x=.75;lift.characters[2].move[0].x=.80;
lift.props[1].x=.57;lift.props[1].move[0].x=.62;
// The lift is performed with planted feet; the following cut elides the walk outside.
for(const c of lift.characters) delete c.move;
lift.props[1].move[0].x=.57;
const ending=sb.scenes.at(-1);
ending.characters[0].x=.29;ending.characters[2].x=.71;
ending.camera=cam(1.08);
ending.props[0].size=.74;
ending.props.push(prop('sun',.5,.34,.18,{zIndex:2,anchor:'center'}));
writeFileSync(new URL('storyboard.json',dir),JSON.stringify(sb,null,2)+'\n');
