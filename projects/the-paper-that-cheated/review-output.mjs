import fs from 'node:fs';import {spawnSync} from 'node:child_process';import {findFfmpeg} from '../../pipeline/env.mjs';
const dir='projects/the-paper-that-cheated',out=dir+'/out',file=out+'/the-paper-that-cheated-shorts.mp4',ff=findFfmpeg();
for(const t of [7.1,25.5,31.6]){const r=spawnSync(ff,['-y','-v','error','-ss',String(t),'-i',file,'-frames:v','1',`${out}/review-${t}.jpg`]);if(r.status!==0)throw Error(r.stderr.toString());}
const r=spawnSync(ff,['-y','-v','error','-ss','24','-i',file,'-t','5','-vn','-ac','1','-ar','24000','-codec:a','libmp3lame','-b:a','32k',`${dir}/build/listening-sample.mp3`]);if(r.status!==0)throw Error(r.stderr.toString());
console.log('Three full-resolution final frames and audio sample extracted.');
