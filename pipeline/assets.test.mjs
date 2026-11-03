import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { propHits, bgHits } from './lexicon.mjs';
import { validateAssets } from '../remotion/story/asset-validation.ts';
const require = createRequire(import.meta.url);
for (const ext of ['.ts','.tsx']) require.extensions[ext] = (module, file) => module._compile(ts.transpileModule(readFileSync(file,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText,file);
const { resolveProp, setCustomProps, PropArt } = require('../remotion/story/Props.tsx');
const { LIFE_PROPS } = require('../remotion/story/LifeProps.tsx');
const { EVERYDAY_PROPS } = require('../remotion/story/EverydayProps.tsx');

test('everyday props and aliases resolve, with English and Arabic planning keywords', () => {
  for (const [name, art] of Object.entries({...EVERYDAY_PROPS, ...LIFE_PROPS})) {
    assert.equal(resolveProp(name), name);
    for (const alias of art.aliases ?? []) assert.equal(resolveProp(alias), name);
  }
  assert.equal(resolveProp('idea'), 'lightbulb');
  assert.equal(propHits(['new', 'idea'])[0]?.key, 'new_idea');
  assert.equal(propHits(['جواز', 'سفر'])[0]?.key, 'passport');
  assert.equal(bgHits(['مطار'])[0]?.key, 'airport');
  assert.equal(resolveProp('plant'), 'tree'); // Preserve the original alias.
  assert.equal(propHits(['egg'])[0]?.key, 'egg');
  assert.equal(propHits(['مطرقة'])[0]?.key, 'hammer');
  assert.equal(propHits(['gold', 'bar'])[0]?.key, 'goldbar');
  assert.equal(bgHits(['kitchen'])[0]?.key, 'kitchen');
  assert.equal(bgHits(['حديقة'])[0]?.key, 'garden');
});

test('real registry accepts aliases/custom SVG paths and rejects unknown/prototype names', () => {
  setCustomProps({game_engine:'<svg viewBox="0 0 200 200"/>'});
  assert.equal(resolveProp('diamond'),'gem');
  assert.equal(resolveProp(' file:props/game-engine.svg '),'game_engine');
  for (const name of ['missing_prop','constructor','__proto__','']) assert.equal(resolveProp(name),null);
  assert.throws(()=>PropArt({name:'missing_prop'}),/Unknown drawing asset/);
  assert.doesNotThrow(()=>PropArt({name:'question'}));
});
test('reports all unknown references including late scenes and held/bubble assets', () => {
  const sb={scenes:[{id:'late',start:100,props:[{name:'missing_prop',at:15}],items:[{prop:'missing_item'}],characters:[{holding:'missing_held'}],bubble:{prop:'missing_bubble'}}]};
  assert.throws(()=>validateAssets(sb,resolveProp), e => ['late','missing_prop','missing_item','missing_held','missing_bubble','holding','bubble.prop'].every(s=>e.message.includes(s)));
});
test('known props, custom assets, image-only and text-only items remain valid', () => {
  assert.doesNotThrow(()=>validateAssets({scenes:[{props:[{name:'diamond'},{name:'game-engine'}],items:[{image:'photo.png'},{text:'Hello'}],characters:[{holding:'book'}],bubble:{prop:'brain'}}]},resolveProp));
});
