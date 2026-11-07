import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {sequenceClips,pcmWav,prepareDialogue} from './dialogue.mjs';
import {dialogueSpeaker,validateStoryMode} from '../remotion/story/story-mode.mjs';
import {validateStoryboard} from './storyboard-tools.mjs';
const sb={version:1,duration:5,cast:{bob:{preset:'thief'},dog:{kind:'dog'}},scenes:[{start:0,end:5,layout:'story',bg:'living_room',characters:[{who:'bob'},{who:'dog'}]}],dialogue:[{who:'bob',start:1,end:2},{who:'dog',start:3,end:4}]};
test('story cast, backgrounds and layouts validate',()=>{assert.deepEqual(validateStoryboard(sb).errors,[]);validateStoryMode(sb);});
test('speaker routing silences gaps and changes exactly at clip boundaries',()=>{assert.equal(dialogueSpeaker(sb,.9),'none');assert.equal(dialogueSpeaker(sb,1),'bob');assert.equal(dialogueSpeaker(sb,2),'none');assert.equal(dialogueSpeaker(sb,3),'dog');assert.equal(dialogueSpeaker({...sb,dialogue:undefined},1),undefined);});
test('reject invalid cast, speaker, overlapping timing and moves',()=>{
 for(const patch of [{cast:{x:{kind:'horse'}}},{dialogue:[{who:'missing',start:0,end:1}]},{dialogue:[{who:'bob',start:0,end:2},{who:'dog',start:1,end:3}]},{scenes:[{characters:[{who:'bob',move:[{at:0,duration:-1,x:.5}]}]}]}]) assert.throws(()=>validateStoryMode({...sb,...patch}));
});
test('clip timing uses actual durations, pauses, and explicit starts',()=>{const clips=[{who:'bob',text:'Hi',gap:0},{who:'dog',text:'Bark',start:2}];assert.deepEqual(sequenceClips(clips,[1,.5]).map(c=>[c.start,c.end]),[[0,1],[2,2.5]]);assert.throws(()=>sequenceClips([{...clips[0]},{...clips[1],start:.5}],[1,1]));});
test('real FFmpeg assembly preserves clip order, inserts silence, never overwrites source',()=>{
 const dir=mkdtempSync(join(tmpdir(),'story-dialogue-'));mkdirSync(join(dir,'voices'));
 const a=Buffer.alloc(4800);for(let i=0;i<a.length;i+=2)a.writeInt16LE(1000,i);
 const source=pcmWav(a,24000);writeFileSync(join(dir,'voices','a.wav'),source);writeFileSync(join(dir,'voices','b.wav'),source);
 writeFileSync(join(dir,'dialogue.json'),JSON.stringify({clips:[{who:'bob',text:'A',file:'voices/a.wav',gap:0},{who:'dog',text:'B',file:'voices/b.wav',start:.2}]}));
 const out=prepareDialogue(dir), wav=readFileSync(out.voice);assert.ok(Math.abs(out.timeline[1].end-.3)<1e-8);assert.equal(wav.readUInt32LE(24),48000);assert.equal(wav.length,44+28800);assert.equal(wav.readInt16LE(44+12000),0);assert.ok(Math.abs(wav.readInt16LE(44+22000)-1000)<30);assert.deepEqual(readFileSync(join(dir,'voices','a.wav')),source);
});
