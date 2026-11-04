// Read-only source sampling. Output is isolated from project deliveries.
import {mkdirSync, writeFileSync} from 'node:fs';
import {resolve, join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {findFfmpeg} from '../pipeline/env.mjs';
const source = process.argv[2];
if (!source) throw new Error('Pass the reference folder as the first argument.');
const out = resolve('out/reference-study');
mkdirSync(out, {recursive:true});
const ff = findFfmpeg(), fp = findFfmpeg('ffprobe');
if (!ff || !fp) throw new Error('FFmpeg and ffprobe are required.');
function run(bin,args) {
  const r=spawnSync(bin,args,{encoding:'utf8',maxBuffer:32*1024*1024});
  if(r.status!==0) throw new Error(r.stderr || r.error?.message);
  return r;
}
const results=[];
for(let i=1;i<=5;i++) {
  const file=join(resolve(source),`video${i}.mp4`);
  const meta=JSON.parse(run(fp,['-v','error','-show_streams','-show_format','-of','json',file]).stdout);
  const duration=Number(meta.format.duration);
  // Seek individual frames: also works with Remotion's minimal FFmpeg build.
  for(let t=0;t<duration;t+=2) {
    run(ff,['-hide_banner','-loglevel','error','-y','-ss',String(t),'-i',file,'-vf','scale=180:-2','-frames:v','1',join(out,`video${i}-${String(t).padStart(3,'0')}.png`)]);
  }
  const audio=run(ff,['-hide_banner','-nostats','-i',file,'-vn','-af','loudnorm=print_format=json','-f','null','-']).stderr;
  results.push({file,duration,streams:meta.streams.map(s=>({type:s.codec_type,width:s.width,height:s.height,fps:s.avg_frame_rate,sampleRate:s.sample_rate})),audioSummary:audio});
  console.log(`Sampled video${i}: ${duration}s`);
}
writeFileSync(join(out,'metadata.json'),JSON.stringify(results,null,2));
