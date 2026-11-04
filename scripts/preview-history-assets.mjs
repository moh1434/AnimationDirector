import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {renderStills} from '../pipeline/remotion-render.mjs';
mkdirSync(resolve('out/asset-library'),{recursive:true});
await renderStills({publicDir:resolve('public'),inputProps:{},frames:[0],outPattern:resolve('out/asset-library/history-assets.jpg'),compositionId:'LibraryHistoryAssets',scale:1});
console.log('Rendered history-assets.jpg');
