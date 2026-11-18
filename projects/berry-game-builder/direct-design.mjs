import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const read = p => JSON.parse(readFileSync(join(dir, p), 'utf8'));
const write = (p, data) => writeFileSync(join(dir, p), JSON.stringify(data, null, 2) + '\n');
const backup = 'build/design-before.json';
if (!existsSync(join(dir, backup))) write(backup, read('storyboard.json'));
const sb = read(backup);
const audio = ['voice.wav', 'build/voice.wav', 'build/mix.wav', 'build/music.wav', 'build/music_bed.wav', 'build/sfx.wav'];
if (!existsSync(join(dir, 'build/design-audio-hashes.json'))) {
  write('build/design-audio-hashes.json', Object.fromEntries(audio.map(p => [p, createHash('sha256').update(readFileSync(join(dir, p))).digest('hex')])));
}
const scene = id => sb.scenes.find(s => s.id === id);
const tag = (text, x = .5, y = .31, extra = {}) => ({ text, style: 'date', x, y, at: 0, ...extra });
const act = (at, pose, expression, extra = {}) => ({ at, who: 'berry', pose, expression, ...extra });
const prop = (name, x, y, size, extra = {}) => ({ name, x, y, size, at: 0, enter: 'none', motion: 'none', ...extra });
const berry = (pose = 'present', expression = 'happy') => ({ who: 'berry', x: .27, y: .87, size: .62, pose, expression, facing: 'right', enter: 'none', zIndex: 5 });
const camera = () => ({ zoom: [1, 1.045], focus: { x: .5, y: .66 }, drift: false });
for (const s of sb.scenes) {
  s.bg = { type: 'living_room', time: 'day' };
  s.light = 'warm';
  s.camera = camera();
  s.transition = 'cut';
  if (s.characters) { s.layout = 'story'; s.characters = [berry(s.characters[0].pose, s.characters[0].expression)]; }
}

const hook = scene('hook');
hook.characters = [{ ...berry('hold', 'excited'), x: .38, holding: 'gamepad' }];
hook.props = [prop('moneybag', .72, .54, .29, { at: '@money', enter: 'pop', face: 'happy', motion: 'bounce' })];
hook.actions = [act('@money', 'present', 'excited', { emote: 'sparkle' })];
const ai = { id: 'ai-helper', start: 2.74, layout: 'story', bg: hook.bg, light: 'warm', speaker: 'berry', characters: [berry('present', 'determined')], props: [prop('robot', .68, .53, .34, { at: '@AI', enter: 'pop', face: 'happy', label: 'AI', motion: 'float' })], actions: [act('@AI', 'point', 'excited'), act('@help', 'explain', 'happy')], camera: camera() };

const design = scene('design');
design.texts = [tag('1 · DESIGN')];
design.props = [prop('pip-sketch', .66, .49, .48, { at: '@ChatGPT', enter: 'pop' }), prop('laptop', .69, .76, .25)];
design.actions = [act('@ChatGPT', 'point', 'excited'), act('@character', 'present', 'proud')];
const traits = scene('give-it-personality');
traits.texts = [tag('1 · DESIGN')];
traits.props[0].y = .51;
traits.props[0].size = .72;
traits.props[0].motion = 'none';
for (const p of traits.props.slice(1)) p.y = .78;

const build = scene('build');
build.texts = [tag('2 · BUILD'), { text: 'Claude', style: 'label', x: .65, y: .66, at: '@Claude', out: '@Godot' }, { text: 'Godot', style: 'label', x: .65, y: .66, at: '@Godot' }];
build.props = [prop('pip-sketch', .66, .49, .48, { out: '@Claude' }), prop('pip-editor', .66, .49, .48, { at: '@Claude', enter: 'pop' })];
build.actions = [act('@give', 'present', 'happy'), act('@Claude', 'point', 'determined'), act('@build', 'explain', 'proud')];
const code = { id: 'ai-writes-code', start: 16.33, layout: 'story', bg: hook.bg, light: 'warm', speaker: 'berry', characters: [berry('cheer', 'excited')], props: [prop('pip-editor', .66, .49, .48), prop('robot', .69, .76, .24, { face: 'happy' })], texts: [tag('2 · BUILD'), { text: 'Godot', style: 'label', x: .65, y: .66, at: 0 }], actions: [act('@AI', 'point', 'happy'), act('@code', 'celebrate', 'excited', { emote: 'idea' })], camera: camera() };

for (const id of ['playtest', 'level-up']) {
  const s = scene(id);
  s.texts = [tag('3 · PLAY & REFINE')];
  for (const p of s.props) if (p.name.startsWith('pip-')) { p.y = .54; p.size = .79; p.motion = 'none'; }
}
scene('level-up').transition = 'cut';
const publish = scene('publish');
publish.layout = 'story'; publish.speaker = 'berry'; publish.characters = [berry('present', 'excited')];
publish.texts = [tag('4 · PUBLISH'), { text: 'Google Play', style: 'label', x: .67, y: .385, at: '@Google', out: '@download' }];
publish.props = [prop('pip-store', .68, .54, .47), prop('arrow_down', .7, .78, .2, { at: '@download', enter: 'pop', out: '@turn' }), prop('coins', .69, .78, .25, { at: '@business', enter: 'pop', motion: 'bounce' })];
publish.actions = [act('@publish', 'point', 'excited'), act('@download', 'present', 'happy'), act('@turn', 'explain', 'proud'), act('@business', 'celebrate', 'excited', { emote: 'sparkle' })];
const payoff = scene('payoff');
payoff.characters = [{ ...berry('celebrate', 'excited'), x: .34, holding: 'gamepad' }];
payoff.props = [prop('pip-store', .7, .51, .4), prop('star', .69, .76, .21, { at: '@today', enter: 'pop', motion: 'bounce' })];
payoff.actions = [act('@today', 'wave', 'happy')];
sb.scenes.splice(1, 0, ai);
sb.scenes.splice(sb.scenes.indexOf(build) + 1, 0, code);
write('storyboard.json', sb);
writeFileSync(join(dir, 'build/direction-notes.md'), `# Design revision\n\nInspired by make-a-game-with-ai: continuous warm living-room staging, Berry reacting to the narrated process, held controller, and four clear chapter labels. Existing Pip artwork remains the game identity.\n\nHook: Berry plays → money appears → AI helper joins. Design: ChatGPT creates Pip → appearance/personality/abilities build in a close demonstration. Build: sketch becomes editor → Berry celebrates AI coding. Refine: play → bug → expanded level and graphics. Publish: finished Pip game reaches a phone → download → business result.\n\nAll original scene word anchors, narration, captions, end hold and audio files are preserved; two visual cuts use existing pause boundaries (2.74 and 16.33 seconds). No audio step runs.\n\nOriginal storyboard: build/design-before.json. Audio baseline: build/design-audio-hashes.json. No substitute media used.\n`);
console.log('Updated 10 visual scenes; audio files untouched.');
