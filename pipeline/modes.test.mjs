import test from 'node:test';
import assert from 'node:assert/strict';
import { MODES, modeOf, compositionFor } from './modes.mjs';

test('each mode renders with its own composition, story by default', () => {
  assert.equal(compositionFor({}), 'StoryVideo');
  assert.equal(compositionFor({ mode: 'story' }), 'StoryVideo');
  assert.equal(compositionFor({ mode: 'explainer' }), 'ExplainerVideo');
  assert.equal(MODES.explainer.host, 'wendy');
  assert.throws(() => modeOf({ mode: 'explainr' }), /must be one of/);
});

test('every mode composition is registered in Root.tsx', async () => {
  const { readFileSync } = await import('node:fs');
  const root = readFileSync(new URL('../remotion/Root.tsx', import.meta.url), 'utf8');
  for (const m of Object.values(MODES)) assert.match(root, new RegExp(`id="${m.composition}"`));
});
