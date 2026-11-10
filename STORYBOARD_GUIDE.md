# Storyboard guide

`projects/<name>/storyboard.json` decides what is on screen. `plan` writes a first draft
automatically (a keyword-based director). You — or Claude — can rewrite any part of it, then run
`make-video.bat <name>` (or `stills.bat <name>` for a quick look). The storyboard is kept between
runs unless you pass `--replan`.

The same storyboard renders **YouTube 16:9** and **Shorts/Reels/TikTok 9:16**: positions come from
the layout, which is laid out separately for each shape. Only give `x`/`y` when you really need a spot.

---

## How the reference videos are built (and what to copy)

The newer five-video portrait study is in [REFERENCE_VIDEO_STUDY.md](REFERENCE_VIDEO_STUDY.md).
Its main refinement is continuity: show a cause, a visible change and a result. Keep a setting
or layout across related beats when that helps understanding; 3–7 s is a drafting heuristic,
not a requirement to reset the picture. A host is useful for personality and reactions, but
a mechanism or geographic explanation can carry the picture without a visible narrator.
The notes below describe the original house-style references, not every newer reference.

* **One idea per shot, 3–7 s.** A shot changes when the narration moves on. Long lines are split.
* **A narrator character on screen most of the time**, talking (lip-synced) and gesturing at things.
* **Flat, saturated grounds** that change colour from shot to shot (mint, yellow, lilac, sky, peach…).
  Space topics use a starry ground; history uses warm/paper tones; title cards use black.
* **Big simple objects with faces** (a smug sun, a worried Earth, a scared rock). Objects appear
  exactly when they are *said*.
* **Very little text**: a word-tag under an object, a big one-word card ("Yes!"), a name card, a number.
* **Limited animation**: poses hold, then snap to the next pose; eyes blink; mouths flap; things pop in
  with squash & stretch; small camera push-ins and punch-zooms on surprises.
* Comedy beats: a confused face + "?", a shrug on "but…", a celebration on good news.

---

## File shape

```json
{
  "version": 1,
  "title": "How old is the Earth?",
  "language": "en",                // "ar" switches text to right-to-left
  "fps": 60,                       // follows video.json (default 60)
  "duration": 31.2,                // the voice's length; the video is never shorter, and may be longer
  "endHold": 0,                    // optional: seconds the picture runs on after the voice ends
  "cast": {
    "host": { "preset": "host" },
    "doc":  { "preset": "scientist", "look": { "shirt": "#ff6b8b" } }
  },
  "captionsByFormat": { "youtube": false, "shorts": true },
  "watermark": "@mychannel",
  "scenes": [ ... ]
}
```

### A scene

```json
{
  "id": "s3",
  "start": 11.2, "end": 17.5,            // seconds in the voice (end = next scene's start)
  "text": "Scientists think the core is 6000 degrees.",
  "layout": "host_talk",
  "bg": "lilac",                          // or {"type": "space"} / {"type":"solid","color":"#ffd"}
  "speaker": "host",                      // whose mouth moves; "none" for nobody; a prop name works too
  "characters": [ { "who": "host", "pose": "point", "expression": "excited" } ],
  "props": [ { "name": "fire", "at": "@core", "face": "smug", "label": "6000°C" } ],
  "texts": [ { "text": "Hot!", "style": "label", "at": 2.1 } ],
  "actions": [ { "at": "@think", "who": "host", "pose": "think", "expression": "thinking", "emote": "question" } ],
  "camera": { "zoom": [1, 1.06], "punch": ["@6000"], "shake": [] },
  "transition": "cut"
}
```

**Times (`at`, `out`, `emoteAt`, `punch`, `shake`)** are seconds from the scene start, or
* `"@word"` – the moment that word is spoken in this scene (first word starting with that text),
* `"w:4"` – the 5th word of the scene.
Word references keep things in sync with the voice, so prefer them.

---

## Layouts

| layout | what it is | uses |
|---|---|---|
| `host_talk` | narrator on one side, 1–4 props on the other | `characters`, `props`, `title` (shown big if there are no props) |
| `hero` | one big object in the middle, small narrator in a corner | `props[0]` (give it a `face`), `characters` |
| `duo` | two characters facing each other, speech bubble | `characters` (2), `bubble` |
| `thought` | character thinking, big thought bubble with an object or text | `characters`, `bubble: {kind:"thought", prop:"earth"}` or `text` |
| `title` | big kinetic text card | `title`, `subtitle`, `bg: {"type":"burst"}` or `"black"` |
| `name_card` | a character with name / role / dates | `characters`, `title`, `subtitle`, `detail` |
| `compare` | A vs B (symbol in the middle) | `items` (2), `symbol`: `VS`, `=`, `≠`, `>`, `<` |
| `transform` | A → B with an arrow | `items` (2) |
| `steps` | 2–5 numbered steps with arrows | `items` |
| `number` | a counting number (+ label) | `number: {value, suffix, prefix, decimals, group, label, from}` |
| `image` | your picture in a photo frame, narrator beside it | `image: {src:"map.png", caption}` (file in the project folder) |
| `news` | newspaper "breaking news" card | `title` (headline), `subtitle` (kicker), optional `image` |
| `crowd` | several characters in a row | `characters` (same `who` repeated gets varied clothes) |
| `free` | nothing automatic: place everything with `x`,`y` | any |

`"mirror": true` flips the layout (narrator on the right) — use it now and then for variety.

## Story actors and dialogue

See [STORY_MODE.md](STORY_MODE.md) for the complete supplied-voice workflow.
`layout: "story"` stages actors on a shared floor. New locations: `living_room`, `house_exterior`,
`park`, `schoolyard`, `street`, each with `"time": "day" | "dusk" | "night"`; existing `office`, `farm`, `classroom`, etc. remain available.

```json
"cast": {
  "bob": {"preset":"thief"},
  "officer": {"preset":"policeman"},
  "dog": {"kind":"dog","look":{"skin":"#c58c58","accent":"#e53950"}}
}
```

This is a cast fragment, not a complete storyboard. Supported animal kinds are dog, cat and bird;
use human presets for people. Actors appear through `characters`, including the animals.
Human additions: thief/farmer/schoolgirl presets; beanie/straw hats; striped/overalls outfits;
mask accessory; star/heart shirtSymbol. Override `characters[].look` for one scene.

`characters[].move` and `props[].move` are ordered lists of `{at, duration | until, x, y?, pose?, arc?, rotate?, ease?, facing?}`.
`at` and `until` take seconds, `"@word"` or `"clip:12"`. Destinations are frame fractions and may be off screen.
Actors turn to their direction of travel. Moves must not overlap. See the table in STORY_MODE.md.
`characters[].zIndex` defaults to 5; `props[].zIndex` defaults to 4. A prop at 6 can occlude an actor.
Actions control pose, expression and gaze, and also `look` (a costume change) and `holding` (`""` puts it down).
Any time can be `"clip:12"`, `"clip:12:end"` or `"clip:12+0.4"`, and a scene can use `"start": "clip:12"`.

For multi-voice projects, `dialogue.json` is the source; the pipeline supplies `storyboard.dialogue`
intervals `{who,start,end}` in absolute seconds. Those intervals override scene/action speaker
selection. Gaps, narrator and none are silent visually. Do not fabricate the generated intervals.

## Characters

`characters: [{ who, pose, expression, facing, emote, emoteAt, holding, enter, at, out, walkFrom, x, y, size }]`

* **who** – a cast id. Cast presets: `host` (default narrator), `scientist`, `student`, `girl`, `woman`,
  `kid`, `king`, `sage`, `soldier`, `worker`, `boss`, `explorer`, `pharaoh`, `bedouin`, `chef`,
  `wizard`, `grandpa`, `robotguy`, and the user's own designs: `adventurer` (explorer girl with a safari
  hat and backpack), `ponytail_girl` (pink side ponytail, bow, frilled dress), `buddy` (spiky orange
  hair, blue shirt, red scarf), `bookworm` (curly hair, round glasses, sweater vest). Their sheet
  folder names also work (`first_female`, `second_female`, `second_male`, `third_male`; `main_male` =
  `host`). A cast entry can override the look:
  `"look": {"skin":"#fff","hair":"curly","hairColor":"#3a2a20","hat":"turban","facial":"beard","outfit":"robe","shirt":"#3fa58c","accessory":"glasses","accent":"#ffc83d","blush":true,"height":0.8}`
  * hair: none tuft spiky curly curlytop long bob bun side messy bald wavy ponytail flowing sideponytail
  * hat: cap grad crown turban helmet hardhat tophat beret wizard chef fez headscarf keffiyeh pharaoh safari bow
  * facial: beard longbeard goatee mustache · outfit: shirt vest coat suit robe dress hoodie armor tunic belted frilldress sweatervest
  * accessory: glasses sunglasses monocle scarf tie bowtie medal neckerchief · extras: `["backpack", "flower_necklace"]`
* **pose** – idle talk explain point point_up point_down wave think shrug celebrate cheer hips scared
  present cross hold hold_up facepalm walk run bow fist write phone
* **expression** – neutral happy excited laughing proud sad crying angry determined surprised shocked
  confused thinking worried smug scared sleepy love dizzy disgusted
* **emote** (above the head) – idea question exclaim sweat anger love sparkle zzz music dizzy
* **holding** – any prop name (drawn in the right hand; use pose `hold` or `hold_up`)
* **enter** – none pop fade drop grow spin slide-left slide-right slide-up slide-down; `walkFrom: -0.2` walks in from off-screen
* The `speaker` lip-syncs automatically and gestures while talking. Change pose/expression mid-scene
  with `actions` (`{at, who, pose, expression, emote, facing, speaker:true}`).

## Props (all original drawings; any of them can have a face)

Unknown prop names stop preview/rendering with an error listing the scene and field. Check the
Library catalogue first, or add a matching SVG under the project's `props/` folder. This also
applies to held objects, items and thought-bubble props, including scenes later in the video.
Use `question` explicitly when a question-mark drawing is intended; it is never a missing-asset fallback.

sun moon earth planet star blackhole galaxy rocket meteor atom dna flask magnifier microscope
lightbulb brain heart book closedbook scroll tablet letter newspaper coin coins money moneybag chart
chart_down clock hourglass calendar phone laptop gamepad robot gear key lock crown sword shield flag
trophy gift house castle pyramid ziggurat tree palm mountain volcano cloud rain lightning fire water
wave snowflake rock gem camera music question exclamation check cross warning globe map compass apple
bomb magnet battery car ship plane skull ghost cat dog fish bird person_icon bacteria pill oil factory
explosion speech eye arrow_up arrow_down telescope satellite well camel sword_crossed bug palette
level_map puzzle target megaphone code_window
egg meat chicken flower lamp joystick goldbar sand seedling leaf mushroom bread wrench hammer scissors backpack
medicine_bottle firstaid taxi ambulance suitcase passport office_chair clipboard love_letter anger new_idea
briefcase wallet cash_stack credit_card storefront birthday_cake juice

Open **Remotion Studio → Library** to see them all.

**Everyday additions:** `LibraryNewProps` shows the 16 new drawings alongside existing book/key references.
Aliases include `steak`, `hen`, `table_lamp`, `arcade_stick`, `gold_bar`, `sand_pile`, `sprout`,
`loaf`, `spanner`, and `schoolbag`. Existing `gold` / `diamond` retain their coin / gem meanings.
English and Arabic narration keywords are registered in `pipeline/lexicon.mjs`.

**New settings:** `forest`, `garden`, `kitchen`, `workshop`. Use `"bg": "garden"` or
`"bg": {"type":"garden","color":"#e3f5de","color2":"#9edb9c"}` (wall/sky and floor).
They use flat fills, low ground lines, and edge scenery with a clear centre in Shorts and YouTube.
Browse `LibraryBackgrounds` in Studio; set `portrait: true` for vertical previews.
Preview sheets: `out/asset-library/props.jpg`, `backgrounds-wide.jpg`, `backgrounds-vertical.jpg`.

**Medicine, travel, office and business additions:** `LibraryLifeProps` shows the next 18 props.
`medicine_bottle` is a bottle, `firstaid` a medical kit, `love_letter` an envelope with a heart,
`birthday_cake` a celebration cake with candles, `juice` a glass with a straw and orange slice,
`anger` an anger-mark speech bubble, and `new_idea` a bulb with idea rays. Existing `medicine`,
`heart`, `car`, `idea`, and `cash` still select their original drawings.
Use `bg: "office"` or `bg: "airport"` for the two new settings; `color` and `color2` override
wall and floor as with the other flat settings. Browse `LibraryLifeBackgrounds` (set `portrait: true`
for Shorts). The second-batch preview sheets are `out/asset-library/life-props.jpg`,
`life-backgrounds-wide.jpg`, and `life-backgrounds-vertical.jpg`.

**Your own drawings:** an SVG saved as `projects/<name>/props/<prop-name>.svg` is used by its file
name anywhere a prop name goes (`{"name": "game-engine"}`, `{"prop": "game-engine"}`), and can have a
`face` too. Draw it in the house style (`.claude/skills/assets/SKILL.md`).

`props: [{ name, at, out, face, label, motion, color, color2, size, x, y, rotate, flip, enter, talking }]`
* `face`: an expression name (or `true`) — personify it. `talking: true` makes the prop lip-sync.
* `motion`: float (default) spin pulse shake bounce orbit none.
* `label`: a short tag under it. Keep labels to 1–3 words.

## Text

`texts: [{ text, style, at, out, x, y, size, color, rotate }]`, styles: `title` (big outlined display
font), `big` (huge single word), `label` (tag), `date` (yellow tag), `note` (plain sentence).

## Backgrounds

`bg`: a colour name (mint aqua yellow lemon cream peach orange pink rose red lilac purple indigo sky
blue teal lime green paper white slate night black), a hex colour, or a type:
`{"type": "space"|"night"|"sky"|"desert"|"sea"|"city"|"room"|"stage"|"classroom"|"lab"|"underground"|"burst"|"grid"|"gradient"|"paper"|"dark"|"image", "color": ..., "color2": ..., "image": "photo.jpg"}`.
Change the ground colour every shot or two.

## Story asset pack

### Character, object and history additions

Props: `monster`, `gun` (aliases `pistol`, `handgun`), `visa_card`, `amphora`,
`ancient_column`, `chariot`, `ancient_helmet`, `sundial`. Existing `bomb` remains available.
`visa_card` is a stylized payment card with a plain VISA label, not an exact bank-issued design.
History objects are generic illustrations, not reconstructions of a specific place or period.
The monster has a built-in eye and mouth; omit `face` for its natural appearance.

Character preset: `policeman` (aliases `police`, `police_officer`), with a new `police_cap`
hat and `police_uniform` outfit. Use `cast: { officer: { preset: "policeman" } }` and
`characters: [{ who: "officer", pose: "talk" }]` with normal expressions and lip-sync.
The character is separate from props and carries no weapon by default.
Studio preview: `LibraryHistoryAssets`; sheet: `out/asset-library/history-assets.jpg`.


Props: `horse` (alias `pony`), `cart` (alias `wagon`), `tractor`, `pigeon`
(alias `carrier_pigeon`), and `bat`. These are static original drawings: use standard entrance
and movement controls; they do not contain walking, wheel-turning or wing-flapping rigs.
Animals have built-in eyes; omit `face` for their natural appearance.

Backgrounds: `village`, `ruins`, `hilltop`. Each keeps a clear central stage with scenery to the
sides and adapts to portrait/landscape. `color` overrides the sky, `color2` the foreground.
The hilltop building and ruins are generic scenery, not depictions of a real historical site.
English and Arabic narration keywords are registered. Studio: `LibraryStoryProps` and
`LibraryStorySettings` (set its `page` prop to `village`, `ruins` or `hilltop`).
Preview sheets: `out/asset-library/story-props.jpg`, `story-village.jpg`, `story-ruins.jpg`,
`story-hilltop.jpg`. Regenerate with `node scripts/preview-story-assets.mjs`.

## Mechanism asset pack

New props: `clay_pot`, `pot_cutaway`, `soil_roots`, `soil_bare`, `water_low`,
`water_half`, `water_full`, `thermometer_cold`, `thermometer_hot`, `heat_arrows`, `wind_arrows`.
New background: `farm` (optional `color` for sky and `color2` for foreground).
Preview in Studio: `LibraryMechanisms` and `LibraryFarm`.

These are original flat drawings, with matching geometry for state pairs. Use the same position
and size when swapping states with `at`/`out` or a scene cut. The pot cutaway is a schematic nested
container; do not present it as a measured scientific section. Water/thermometer drawings do not
encode numeric values: add the actual narrated value as a separate label. Directional arrows point
up (heat) and right (wind). They are static artwork, not an automatic fluid or heat simulation.
Leave diagram faces off to keep roots, liquid levels and markings unobscured.

## Camera & transitions

`camera: {zoom:[from,to], pan:[dx,dy], punch:[times], shake:[times], focus:{x,y}}` — a slow push-in
is applied by default; `punch` = quick zoom bump on a surprising word; `shake` = impact.
`transition` (into this scene): cut (default, like the references), whip, iris, flash, zoom, fade, slide.

## Sound

Sound effects are generated from what happens on screen (pops for objects, whooshes for whips,
ticks for counting numbers, a ding for ideas…). Only the important ones are kept so the track does
not clatter; `"sfxDensity": "sparse" | "normal" | "full"` (top level of the storyboard) changes how
many. Add your own (always kept) with
`sfx: [{at:"@boom", name:"thud"}]` — names: pop tick boop ding sparkle whoosh swoosh swish boing hit thud iris.
Music is composed per video (pretty_midi → Tone.js) and scored to the picture: the tempo is fitted
so transitions and title cards land on beats, the melody plays only in the voice's pauses, and the
ending lands after the last word (see `build/spotting.json`). Set `"music"` in video.json to a mood
(playful curious epic space upbeat calm), `"none"`, or a path to your own track.

---

## Directing checklist (for Claude or a human)

1. Read the whole narration first; decide the cast (the narrator + any recurring characters).
2. One scene per idea, 3–7 s; split long segments at sentence ends (use word times from
   `build/analysis.json` → `words`). Scene `start` must match a word start; `end` = next `start`.
3. Complete the visual story worksheet in `build/brief.md` (save your notes separately).
   Choose the layout that *explains* the sentence best. Preserve setting and screen direction
   across related beats; vary layouts and grounds when the meaning or location changes.
4. Make objects appear on the word that names them (`"at": "@word"`), give some of them faces
   and an expression that comments on the line.
5. Add 1–3 `actions` per scene so the narrator reacts (point when an object appears, shrug on "but",
   think on a question, celebrate on good news).
6. Use a `title` card for punchlines and short dramatic lines; a `number` scene for key figures.
7. Never invent facts, maps or real people's likenesses; use `image` with the user's own pictures.
8. Keep on-screen text readable: a sentence needs words ÷ 3 + 1 s on screen (less if the voice says
   it at the same time); labels 1–3 words; titles ≤ ~6 words; ≤ 6 things in a scene.
9. Run `pnpm video validate <name>` and fix every error (it names the scene, the field and a fix).
   Then run `pnpm video check <name>` (Shorts; `--format both` adds YouTube stills) and fix every error;
   look at `out/check/` stills.
   See `.claude/skills/layout-composition/SKILL.md` for spacing, sizes and safe areas.
10. `make-video.bat` in the project folder, then read `out/final-pass.md` and the frame sheets.


## Story mode: characters, animals and dialogue

See [STORY_MODE.md](STORY_MODE.md) for multi-voice supplied recordings, animal actors,
custom wardrobe, illustrated locations and eased character movement. Studio includes
`StoryModeDemo`; the example script and recording manifest are in `examples/story-mode/`.
