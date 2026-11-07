# Step-by-step guide for local / smaller AI models

**Who this is for.** A model running on the user's computer (for example a 7–30B model in Ollama or
LM Studio) that is asked to make a video with this pipeline. Follow it in order, exactly.

**Stronger models (Claude, ChatGPT, …):** this file is optional. It describes a safe default, not a
limit. Use `STORYBOARD_GUIDE.md` and the skills in `.claude/skills/` and direct freely. The commands
below (`brief`, `validate`, `catalog`) are useful to every model.

---

## The job in one sentence

Write `projects/<name>/storyboard.json`: the list of scenes (what is on screen, and when) for the
user's narration. The pipeline does everything else: drawing, animation, music, sound, rendering.

## Never do these

1. Never change the user's words, `script.txt`, or `voice.wav`.
2. Never edit code files (`pipeline/`, `remotion/`, `audio/`). Direct `storyboard.json`; when asked
   to prepare supplied voices, also create/edit the project's `dialogue.json` using STORY_MODE.md.
   Do not change recordings or their transcripts.
3. Never invent names. Every layout, prop, background, pose, expression and character must come from
   the list in `build/brief.md` (or `pnpm video catalog`). Unknown names stop the render.
4. Never run `--replan` on a project someone already directed. It erases their storyboard.
5. Never render the YouTube version. `pnpm video make <name>` makes the Shorts video, and that is
   all you render. The user makes YouTube with `make-landscape-video.bat` when they want it.
6. Never run `pnpm install`, `npm` or `pip`. Everything is already installed.
7. Never invent facts, maps or real people's faces, and never draw logos. A brand name may appear
   as a text label (e.g. `"label": "Godot"`), never as a drawing.

## The steps

### Step 1 — prepare
```
pnpm video plan <name>
```
This analyses the voice and writes two files:
- `projects/<name>/storyboard.json`, an automatic first draft (or the existing one is kept);
- `projects/<name>/build/brief.md`, **everything you need**: each sentence with the time of every
  word, good scene start times, the cast, and every valid name.

Read `build/brief.md` completely. You do not need to read any code.
If the voice is much longer than the script needs, tell the user before directing: recordings must be trimmed and
brisk (see "Pacing" in STORY_MODE.md). Never stretch or cut them yourself.

For a story, copy the sizes from the table in "Scale and layers" in STORY_MODE.md. Never make a person bigger
than 0.42 beside a building: use `camera.zoom` for a close-up. Keep animals at 0.7 or less. Keep props an actor
touches behind the actor (`zIndex` 4) unless they hide the actor on purpose.

For a story with several speakers, first read [STORY_MODE.md](STORY_MODE.md). Supply dialogue.json
and the listed voice files before plan. Also read build/dialogue-timeline.json: these measured
intervals determine who speaks, even when scene.speaker names someone else.

### Step 2 — plan the scenes (write the plan down first)
- **One story beat per scene.** Use a sentence as a starting point; keep related dialogue and
  reactions together when they share a location and action. Split at natural pauses.
- Take each scene's `start` from "Good scene start times" in the brief. The first scene starts at `0`.
- `end` = the next scene's `start` (the last scene ends at the voice length).
- For each scene, decide: the **layout** (table below), the **1–3 objects** that show what is being
  said, and **which word** makes each one appear.

### Step 3 — choose a layout
| The sentence… | layout | needs |
|---|---|---|
| shows characters acting together in a setting | `story` | cast members, illustrated `bg`, optional movement |
| explains something, 1–3 things | `host_talk` | `props` (1–3) |
| is about ONE important thing | `hero` | `props` (1, with a `face`) |
| asks someone something / a dialogue | `duo` | 2 `characters` + `bubble` |
| wonders or imagines | `thought` | `bubble: {"kind": "thought", "prop": …}` |
| is a punchline or a short turn ("Now play it!") | `title` | `title` (≤ 4 words) |
| lists steps or parts | `steps` | `items` (2–5) |
| compares two things | `compare` | `items` (exactly 2), `symbol` |
| says A becomes B | `transform` | `items` (exactly 2) |
| gives a number | `number` | `number: {"value": 42}` |
| talks about many people | `crowd` | 3–4 `characters` |

Keep the same layout and illustrated setting while the story stays in the same place. Change
shots when the action needs it. Do not change background colours or mirror actors arbitrarily.

### Step 4 — write each scene from a template
Copy the template, then replace the CAPITAL words. Keep all quotes, commas and brackets.

**host_talk** (the most common one)
```json
{
  "id": "s1", "start": 0, "end": 2.66,
  "text": "THE SENTENCE",
  "layout": "host_talk", "bg": "peach", "speaker": "host",
  "characters": [{ "who": "host", "pose": "talk", "expression": "happy" }],
  "props": [
    { "name": "PROP1", "at": "@WORD1", "face": "happy", "label": "1-3 WORDS" },
    { "name": "PROP2", "at": "@WORD2" }
  ],
  "actions": [{ "at": "@WORD1", "who": "host", "pose": "point" }]
}
```
**hero**
```json
{ "id": "s2", "start": 2.66, "end": 4.56, "text": "THE SENTENCE", "layout": "hero", "bg": "orange", "speaker": "host",
  "characters": [{ "who": "host", "pose": "point", "expression": "excited" }],
  "props": [{ "name": "PROP", "at": "@WORD", "face": "excited" }] }
```
**steps**
```json
{ "id": "s3", "start": 8.3, "end": 11.3, "text": "THE SENTENCE", "layout": "steps", "bg": "lilac", "speaker": "host",
  "characters": [{ "who": "host", "pose": "talk", "expression": "happy" }],
  "items": [
    { "prop": "PROP1", "at": "@WORD1", "label": "WORD" },
    { "prop": "PROP2", "at": "@WORD2", "label": "WORD" },
    { "prop": "PROP3", "at": "@WORD3", "label": "WORD" }
  ] }
```
**compare** (use `"layout": "transform"` and no `symbol` for "A becomes B")
```json
{ "id": "s4", "start": 11.3, "end": 15.7, "text": "THE SENTENCE", "layout": "compare", "bg": "sky", "speaker": "host",
  "characters": [{ "who": "host", "pose": "explain", "expression": "thinking" }],
  "items": [{ "prop": "PROP_A", "at": "@WORD_A", "label": "A" }, { "prop": "PROP_B", "at": "@WORD_B", "label": "B" }],
  "symbol": "VS" }
```
**duo**
```json
{ "id": "s5", "start": 4.56, "end": 8.3, "text": "THE SENTENCE", "layout": "duo", "bg": "mint", "speaker": "host",
  "characters": [{ "who": "host", "pose": "talk", "expression": "happy" }, { "who": "buddy", "pose": "idle", "expression": "surprised" }],
  "bubble": { "who": "host", "text": "SHORT LINE", "at": "@WORD" } }
```
(Every `who` must be in `"cast"` at the top of the file, e.g. `"buddy": { "preset": "buddy" }`.)

**thought**
```json
{ "id": "s6", "start": 2.66, "end": 4.56, "text": "THE SENTENCE", "layout": "thought", "bg": "mint", "speaker": "host",
  "characters": [{ "who": "host", "pose": "think", "expression": "thinking" }],
  "bubble": { "kind": "thought", "prop": "PROP", "at": "@WORD" } }
```
**title**
```json
{ "id": "s7", "start": 17.58, "end": 18.29, "text": "THE SENTENCE", "layout": "title", "bg": "black", "speaker": "none",
  "title": "UP TO 4 WORDS", "transition": "flash" }
```
**number**
```json
{ "id": "s8", "start": 20.0, "end": 24.0, "text": "THE SENTENCE", "layout": "number", "bg": "yellow", "speaker": "host",
  "characters": [{ "who": "host", "pose": "present", "expression": "excited" }],
  "number": { "value": 6000, "suffix": "°C", "label": "1-3 WORDS", "at": "@WORD" } }
```

### Rules for the values
- `"at": "@word"`: the word must be spoken **inside this scene** (see the brief). Use the word's
  first letters, e.g. `"@money"`. Words with punctuation are fine without it: `"@abilities"`.
- **Objects**: pick the drawing that *means* the word. Search the props list for it. Common aliases
  work too (`"computer"` → laptop, `"diamond"` → gem). If nothing fits, choose a simple related
  object, or leave it out. Never write a name that is not in the list.
- **Labels**: 1–3 words. Not every object needs one.
- **Faces** on 1–2 objects per scene, with an expression that comments on the line
  (`"face": "scared"` on a bug, `"smug"` on money).
- **Narrator acting**: 1–2 `actions` per scene. Point when an object appears (`"pose": "point"`),
  `"shrug"` on "but…", `"think"` on a question, `"celebrate"` on good news.
- **Camera** (optional): `"camera": { "punch": ["@WORD"] }` on the one surprising word of a scene.
- **Transitions** (optional): mostly leave them out (a cut). Use `"transition": "whip"` when a new
  part of the story starts.

### Step 5 — validate, and fix until clean
```
pnpm video validate <name>
```
It prints numbered errors, each saying exactly where and what to change, usually with
"Did you mean: …". Fix **every error**, then run it again. Repeat until it says `✔ No errors.`
Warnings are advice; fix them if it is easy.

If it says the file is not valid JSON: look at the line it names; usually a missing comma between
`}` and `{`, a comma after the last item, or a missing quote.

### Step 6 — check the layout
```
pnpm video check <name>
```
Read `projects/<name>/out/check-shorts.md`. Fix every **error** (move the text, shorten a label,
use fewer objects). If you can look at images, open 2–3 stills in `out/check/` and confirm the
scene shows what the sentence says. Then run `validate` again.

### Step 7 — render the Shorts video
```
pnpm video make <name>
```
This takes a few minutes. When it finishes, read `projects/<name>/out/final-pass.md`. Every line
should have ✔.

### Step 8 — tell the user
Say, briefly:
- which file was made: `projects/<name>/out/<name>-shorts.mp4`;
- whether the final pass passed;
- anything you could not do (e.g. "no drawing for 'passport', used 'map' instead");
- that they can make the YouTube version with `make-landscape-video.bat` in the project folder.

### Optional step 9 — the Arabic version (only if the user gave Arabic files)
The project folder has `voice-ar.wav` and `script-ar.txt`. After the English video is done:
```
pnpm video localize <name> --lang ar
```
Open `projects/<name>-ar/translations.json` and write the Arabic for every empty `""` value (keep
names like ChatGPT in English letters). Run the command again, then do steps 5–7 with `<name>-ar`.

---

## A complete example (first three scenes of `projects/make-game-with-ai`)

```json
{
  "version": 1,
  "title": "Make a game with AI!",
  "language": "en",
  "cast": { "host": { "preset": "host" } },
  "directedBy": "local-model",
  "scenes": [
    {
      "id": "s1", "start": 0, "end": 2.66,
      "text": "Want to create your own game and make money from it?",
      "layout": "host_talk", "bg": "peach", "speaker": "host",
      "characters": [{ "who": "host", "pose": "explain", "expression": "excited", "emote": "question" }],
      "props": [
        { "name": "gamepad", "at": "@game", "face": "happy", "label": "your game" },
        { "name": "moneybag", "at": "@money", "face": "smug" }
      ],
      "actions": [{ "at": "@game", "who": "host", "pose": "point" }],
      "camera": { "punch": ["@money"] }
    },
    {
      "id": "s2", "start": 2.66, "end": 4.56,
      "text": "Here's how AI can help you do it.",
      "layout": "thought", "bg": "mint", "speaker": "host",
      "characters": [{ "who": "host", "pose": "think", "expression": "thinking" }],
      "bubble": { "kind": "thought", "prop": "robot", "at": "@AI" }
    },
    {
      "id": "s3", "start": 4.56, "end": 8.3,
      "text": "First, ask ChatGPT to design a 2D game character.",
      "layout": "host_talk", "bg": "yellow", "speaker": "host",
      "characters": [{ "who": "host", "pose": "talk", "expression": "neutral" }],
      "props": [
        { "name": "robot", "at": "@ChatGPT", "label": "ChatGPT" },
        { "name": "person_icon", "at": "@character", "face": "happy" }
      ],
      "actions": [{ "at": "@ChatGPT", "who": "host", "pose": "point" }],
      "transition": "whip"
    }
  ]
}
```
Why it works: each scene is one sentence; every object appears on the word that names it; a brand
(ChatGPT) is a label, not a drawing; the backgrounds change; the narrator points when things appear.

## When something goes wrong
| Message | What to do |
|---|---|
| `"X" is not a drawing. Did you mean: …` | Use one of the suggestions. |
| `"@word" is not spoken in this scene` | Use a word listed in that message, or a number of seconds (`1.2`). |
| `layout "steps" needs 2–5 items` | Add or remove items, or choose another layout. |
| `who "X" is not in "cast"` | Add it to `cast` with a preset from the list, or use `host`. |
| `starts … not after the previous scene` | Scenes must be in time order with increasing `start`. |
| check: `collision` / `safe-area` error | Fewer objects, shorter labels, or another layout. |
| a command fails with a long error | Stop and show the user the last 20 lines. Do not edit code. |
