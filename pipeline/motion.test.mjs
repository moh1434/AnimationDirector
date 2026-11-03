import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleTrack, speechEnvelope } from '../remotion/story/motion.ts';

test('interrupted gestures preserve position and velocity', () => {
  const events = [{at:0,value:[100]}, {at:0.2,value:[-20]}];
  const f = t => sampleTrack([0],events,t,0.42)[0];
  const h = 0.00001;
  assert.ok(Math.abs(f(0.2-h)-f(0.2+h)) < 0.01);
  assert.ok(Math.abs((f(0.2)-f(0.2-h))/h - (f(0.2+h)-f(0.2))/h) < 0.1);
  assert.equal(f(1),-20);
});
test('sampling is independent of render order and fps', () => {
  const events = [{at:0.1,value:[1,20]}, {at:0.3,value:[0,0]}];
  const expected = sampleTrack([0,0],events,0.4,0.42);
  sampleTrack([0,0],events,5,0.42);
  assert.deepEqual(sampleTrack([0,0],events,12/30,0.42),expected);
  assert.deepEqual(sampleTrack([0,0],events,24/60,0.42),expected);
});
test('speech smoothing suppresses spikes without moving the peak', () => {
  const samples = Array(30).fill(0); samples[15]=100;
  assert.ok(speechEnvelope(samples,15,30) < 0.5);
  assert.ok(speechEnvelope(samples,15,30) > speechEnvelope(samples,14,30));
  assert.equal(speechEnvelope(samples,14,30),speechEnvelope(samples,16,30));
});
