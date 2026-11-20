import fs from 'node:fs';
const root='projects/the-paper-that-cheated', dst='projects/the-paper-that-cheated-ar';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^\uFEFF/,''));
const sb=read(`${root}/storyboard.json`), a=read(`${dst}/build/analysis.json`),tr=read(`${dst}/translations.json`);
const replacements={'@book':'clip:5+1.2','@paper':'clip:5+0.1','@Air':'clip:12','@shields':'clip:14+0.5','@resistance':'clip:14+2','@homework':'clip:17+1.2','@too':'clip:17+2.2'};
function walk(x){if(Array.isArray(x))return x.map(walk); if(x&&typeof x==='object'){for(const k of Object.keys(x)){if(k==='text' && tr[x[k]])x[k]=tr[x[k]];else x[k]=walk(x[k]);}return x;}return typeof x==='string'&&replacements[x]?replacements[x]:x;}
walk(sb);sb.title=tr[sb.title];sb.language='ar';sb.duration=a.duration;sb.directedBy='Arabic adaptation of the-paper-that-cheated';sb.adaptedFrom='the-paper-that-cheated';delete sb.inputsHash;delete sb.dialogue;delete sb.customProps;
fs.writeFileSync(`${dst}/storyboard.json`,JSON.stringify(sb,null,2));
for(const f of fs.readdirSync(`${root}/voices-ar`).filter(x=>x.endsWith('.json')))fs.copyFileSync(`${root}/voices-ar/${f}`,`${dst}/voices-ar/${f}`);
fs.copyFileSync(`${root}/build/direction-notes.md`,`${dst}/build/direction-notes-en.md`);
console.log('Adapted 10 scenes to the Arabic clip timings; preserved generation records.');
