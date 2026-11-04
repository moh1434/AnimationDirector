import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {renderStills} from '../pipeline/remotion-render.mjs';
const out=resolve('out/asset-library');
mkdirSync(out,{recursive:true});
for (const page of ['props','village','ruins','hilltop']) {
 await renderStills({publicDir:resolve('public'),inputProps:{page},frames:[0],outPattern:resolve(out,`story-${page}.jpg`),compositionId:page==='props'?'LibraryStoryProps':'LibraryStorySettings',scale:1});
 console.log(`Rendered story-${page}.jpg`);
}
