import {spawnSync} from 'node:child_process';import {findFfmpeg} from '../../pipeline/env.mjs';
const dir='projects/the-paper-that-cheated-ar/out', ff=findFfmpeg();
for(const t of [9.4,21.1,35.9,45.4]) {const r=spawnSync(ff,['-y','-v','error','-ss',String(t),'-i',`${dir}/the-paper-that-cheated-ar-shorts.mp4`,'-frames:v','1',`${dir}/review-${t}.jpg`]);if(r.status!==0)throw Error(r.stderr.toString());}
