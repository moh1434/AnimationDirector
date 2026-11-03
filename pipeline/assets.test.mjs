import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { validateAssets } from '../remotion/story/asset-validation.ts';
const require = createRequire(import.meta.url);
for (const ext of ['.ts','.tsx']) require.extensions[ext] = (module, file) => module._compile(ts.transpileModule(readFileSync(file,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText,file);
const { resolveProp, setCustomProps, PropArt } = require('../remotion/story/Props.tsx');

test('real registry accepts aliases/custom SVG paths and rejects unknown/prototype names', () => {
  setCustomProps({game_engine:'<svg viewBox="0 0 200 200"/>'});
  assert.equal(resolveProp('diamond'),'gem');
  assert.equal(resolveProp(' file:props/game-engine.svg '),'game_engine');
  for (const name of ['chicken','constructor','__proto__','']) assert.equal(resolveProp(name),null);
  assert.throws(()=>PropArt({name:'chicken'}),/Unknown drawing asset/);
  assert.doesNotThrow(()=>PropArt({name:'question'}));
});
test('reports all unknown references including late scenes and held/bubble assets', () => {
  const sb={scenes:[{id:'late',start:100,props:[{name:'chicken',at:15}],items:[{prop:'egg'}],characters:[{holding:'gun'}],bubble:{prop:'flower'}}]};
  assert.throws(()=>validateAssets(sb,resolveProp), e => ['late','chicken','egg','gun','flower','holding','bubble.prop'].every(s=>e.message.includes(s)));
});
test('known props, custom assets, image-only and text-only items remain valid', () => {
  assert.doesNotThrow(()=>validateAssets({scenes:[{props:[{name:'diamond'},{name:'game-engine'}],items:[{image:'photo.png'},{text:'Hello'}],characters:[{holding:'book'}],bubble:{prop:'brain'}}]},resolveProp));
});
