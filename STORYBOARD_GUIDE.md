# Storyboard guide

`projects/<name>/storyboard.json` decides what is on screen. `plan` writes a first draft
automatically (a keyword-based director). Edit the draft to fit the narration and inspect it with
`pnpm video stills <name> --format shorts`. The storyboard is kept between
runs unless you pass `--replan`.

The same storyboard renders **YouTube 16:9** and **Shorts/Reels/TikTok 9:16**: positions come from
the layout, which is laid out separately for each shape. Only give `x`/`y` when you really need a spot.

---

For shot selection, continuity, and portrait examples use [Portrait direction](REFERENCE_VIDEO_STUDY.md). For rendering and lighting conventions use [Art style](ART_STYLE.md). This guide documents the JSON fields. Use `pnpm video catalog` for the current names.

## File shape

```json
{
  "version": 1,
  "title": "How old is the Earth?",
  "language": "en",                // "ar" switches text to right-to-left
  "fps": 30,                       // follows video.json, else VIDEO_FPS in .env (default 30)
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
| `hero` | one big object in the middle, small narrator in a corner | `props[0]` (optional `face`), `characters` |
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

`"mirror": true` flips the layout (narrator on the right) — use it when staging requires the opposite orientation. Keep screen direction consistent across a sequence.

## Story actors and dialogue

See [STORY_MODE.md](STORY_MODE.md) for the complete supplied-voice workflow.
`layout: "story"` stages actors on a shared floor. New locations: `living_room`, `house_exterior`,
`park`, `schoolyard`, `street`, each with `"time": "day" | "dusk" | "night"`; existing `office`, `farm`, `classroom`, etc. remain available.
`car` and `car_park` are the inside of a car seen through the windscreen (passenger left, driver right; the street or the
park with the swings slides past the rear window): stand the actors at y 0.97, size 0.5, and put the `car_dash` prop (or
`car_dash_turn`, whose wheel turns) in front of them at x 0.5, y 1, size 0.5, zIndex 6. Pose `sit_front` sits an actor
facing the viewer (on a step or bench seen from the front). Family props: `front_step` (put it against a house's wall
line), `fruit_bowl`, `fruit_bowl_partial`, `apple_red`, `milk`, `grocery_bag`, `shoes` (color), `sweater` (color),
`swing_set`, `green_house`. An actor who `move`s walks, so don't move a seated actor: cut to a new shot with them in place.

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

* **who** – a cast id. Cast presets: `benny` (Benny, Berry's and Cherry's friend: brown quiff with cropped sides, yellow hoodie, grey cargo trousers, yellow sneakers;
  his old names `host` and `narrator` still select him), `scientist`, `student`, `girl`, `woman`,
  `kid`, `king`, `sage`, `soldier`, `worker`, `boss`, `explorer`, `pharaoh`, `bedouin`, `chef`,
  `wizard`, `grandpa`, `robotguy`, `berry` (the channel's leader: berry-pink bun hair with light pink ends, a springy curl
  and a star clip, freckles, blush blouse with a star brooch, long yellow skirt; also `leader`, `main_female`), `curly_girl` (plum curls with a big side puff and a coral bow, freckles,
  yellow tee, teal short dungarees with a heart pocket), and the user's own designs: `adventurer` (explorer girl with a safari
  hat and backpack), `ponytail_girl` (one high pink ponytail with a bow, frilled dress), `buddy` (spiky orange
  hair, blue shirt, red scarf), `bookworm` (curly hair, round glasses, sweater vest), `cherry` (dark brown high ponytail with a cherry
  clip, red hoodie, black pleated skirt and tights, red high-top sneakers), and `somi` (plum bob with a mint clip,
  sage zip hoodie, purple sneakers and a pocket notebook). Their sheet
  folder names also work (`first_female`, `second_female`, `second_male`, `third_male`; `main_male` =
  `host`). A cast entry can override the look:
  `"look": {"skin":"#fff","hair":"curly","hairColor":"#3a2a20","hat":"turban","facial":"beard","outfit":"robe","shirt":"#3fa58c","accessory":"glasses","accent":"#ffc83d","blush":true,"height":0.8}`
  * hair: none tuft spiky curly curlytop long bob bun side messy bald wavy ponytail flowing sideponytail starbuns curlypuff highponytail schoolbob sidebob shaggy quiff
    (`starbuns` also takes `"hairTips"`, the colour of the ends, and `"hatColor"` for its star clip; `curlypuff` and `highponytail` take `"hatColor"` for their bow, so leave `hat` out with them;
    `schoolbob` and `sidebob` take `"hatColor"` for the clip; `schoolbob` also accepts `accent` as a fallback. `long` hangs behind the shoulders. Hair is hidden under
    the wrap hats `headscarf`, `keffiyeh` and `pharaoh`. `keffiyeh`: `hatColor` is the cloth, `accent` its patterned edge.
    `pharaoh`: `accent` is the cloth and the gold band, `hatColor` the stripes)
  * hat: cap grad crown turban helmet hardhat tophat beret wizard chef fez headscarf keffiyeh pharaoh safari bow
  * build: `kid` (about 2 heads tall, 0.84 × a teen's height) · `teen` (about 2.5 heads; Cherry and the other young presets) ·
    `adult` (about 2.7 heads, 1.06 × a teen, longer arms and legs; Berry, Wendy, Benny, and the default when a look has no build). Nobody has
    a neck: the head sits on the collar in every build. `size` is a teen's height, so a kid and an adult at the same `size` stand
    shorter and taller than a teen. `height` still fine-tunes one character.
  * head: round egg wide bean oval square (`bean` is fuller at the back of the jaw, `oval` is longer than `egg`, `square` has soft corners)
  * eyes: `big` (the large white eye, default) · `halfshut` (a heavy upper lid, a dry and knowing look) · `iris` (a smaller eye with a coloured iris; set `"irisColor"`) ·
    `flick` (a thick lash line that flicks out at the corner; it replaces `lashes`). Expressions work with every style.
  * **One design per character.** `build`, `head` and `eyes` are part of who a character is: presets already have theirs, so
    don't override them. When you create a new character, set all three in its `cast.look`: pick the build from its age
    (`kid` or `teen` for young people, `adult` for grown-ups), and a head and eye style that tell it apart from the others
    on screen. Keep them the same for the whole video (never change them in `characters[].look` or `actions[].look`),
    and keep them for a character who comes back in later videos.
  * facial: beard longbeard goatee mustache · outfit: shirt vest coat suit robe dress hoodie ziphoodie armor tunic belted frilldress sweatervest pinafore dungarees sailor chefcoat hoodieskirt cardiganskirt blouseskirt
    (`dungarees`: `shirt` is the tee, `pants` the dungarees, `accent` the heart; `chefcoat` is a white chef's jacket: `accent` colours the neckerchief, `pants` the trousers;
    `sailor` is a school uniform:
    `shirt` colours the collar and pleated skirt, `accent` the ribbon, the blouse is white; add `"socks"` for knee socks;
    `hoodieskirt` is a roomy hoodie (`shirt`) with white drawstrings over a short pleated skirt (`pants`); `cardiganskirt` is an open cardigan (`shirt`) over a collared shirt (`accent`) and a skirt (`pants`);
    `blouseskirt` is a collared blouse (`shirt`) tucked into a skirt (`pants`) with a sash (`accent`); `"skirt":"midi"` makes these three skirts mid-calf, for grown-ups; `ziphoodie` uses `accent` for the zipper)
  * accessory: glasses sunglasses monocle scarf tie bowtie medal neckerchief · extras: `["backpack", "flower_necklace", "notebook"]`. The notebook follows the hand and gives way to a scene's `holding` prop.
  * small details: `"freckles": true`, `"lashes": true`, `"shoes": "#ff6b6b"` (shoe colour), `"socks": "#4055a0"` (knee socks, with bare-leg outfits), `"hands": "#ffe8cf"` (hand colour, to match a non-white `skin`),
    `"tights": "#2b2430"` (full tights, with bare-leg outfits), `"hightops": true` (high-top sneakers in the `shoes` colour), `"sneakers": true` (low canvas sneakers),
    `"cargo": true` (thigh pockets and rolled cuffs, with trousers),
    `"hairClip": "cherry"` (cherries in `hatColor` instead of the `highponytail` bow)
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
Keep the location and palette across connected shots. Change them when place, time or the explanation changes.

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

`camera: {zoom:[from,to], pan:[dx,dy], punch:[times], shake:[times], focus:{x,y}, on, moves, tilt, drift}` — a slow
push-in and a slight hand-held drift are applied by default; `punch` = quick zoom bump on a surprising
word; `shake` = impact.

* `on: "berry"` aims at that cast member's face and centres them (a close shot; use `zoom` 1.2–1.4, and 1.0–1.2 in Shorts when others stand beside them, so nobody is cut at the sides). The character
  must be in the scene; with both `on` and `focus`, `focus` wins. `zoom` is always 1 to 3.
* `moves: [{at, zoom, on, focus, duration}]` change the shot inside the scene. `at` takes seconds, `"@word"` or
  `"clip:N"`. `duration: 0` is a cut, the default 0.55 s a push-in. Example: cut to the listener's face on a word:
  `{"at": "@work", "zoom": 1.3, "on": "berry", "duration": 0}`; back to both: `{"at": "clip:4", "zoom": 1.1, "focus": {"x": 0.5, "y": 0.84}}`.
* `tilt: [from, to]` rolls the camera slowly (−4 to 4 degrees; a tilted shot is also enlarged to cover the corners).
  `drift: false` switches off the hand-held sway; add `zoom: [1, 1]` for a completely locked frame.
  In a move, `on: ""` stops centring and keeps the current aim.
* Frame close: a person should usually fill a third of the frame height or more. Use `moves` when the viewer needs a closer look at an action or reaction. Keep the setting recognizable.

`light` (per scene): `day warm cool dusk night spot none`. Left out, it follows the background (day outdoors, warm
indoors, night at night). `spot` darkens the set around a pool of light in the middle while the actors stay bright, for a punchline or an aside.
`validate` refuses an unknown light, a camera `on` that is not in the scene, and a zoom below 1.

`transition` (into this scene): cut (default), whip (sideways streak), slide (push), zoom (through the picture),
iris (circle opens), flash (white), fade. See ART_STYLE.md for when to use each.

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

## Checking the storyboard

Run `pnpm video validate <name>` and fix field and timing errors. Run `pnpm video check <name> --format shorts`, then inspect `out/check-shorts.md` and `out/check/`. Allow time to read each label or title. As a starting estimate, a written sentence needs its word count divided by three, plus a second. Check the opening, action, result and exit in sequence with the voice. See [production workflow](AGENTS.md) for export and final review.
