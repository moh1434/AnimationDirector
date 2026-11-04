import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {renderStills} from '../pipeline/remotion-render.mjs';
const out=resolve('out/asset-library');
mkdirSync(out,{recursive:true});
for (const [id,file] of [['LibraryMechanisms','mechanisms.jpg'],['LibraryFarm','farm.jpg']]) {
  await renderStills({publicDir:resolve('public'),inputProps:{},frames:[0],outPattern:resolve(out,file),compositionId:id,scale:1});
  console.log(`Rendered ${file}`);
}
