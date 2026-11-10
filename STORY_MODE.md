# Story mode

For videos where characters act out a story: costumes, indoor and outdoor places, day or night,
animals, and a different voice for each speaker. It extends the normal pipeline, and single-narrator
projects keep working unchanged. **Nothing new needs installing**: voices are assembled with FFmpeg.

## Make a story

No recordings, only a script? [TTS.md](TTS.md) makes them locally (Audar-TTS clones a voice, Qwen3-TTS designs
a new one): one take per character, picked by the user, then cut into lines and written as
`dialogue.json` + `voices/` (steps 1–2 below).

**A new character gets a new voice.** When you draw or cast a character who speaks and has no
recording (a new costume, preset, animal or extra), make its voice the same way: describe a voice
that matches the drawing (age, size, kind, mood), make takes, and let the user pick. The other
characters keep their recordings: see "Adding a voice to a story" in TTS.md. A character who will
come back in later videos is saved with `voice-ref --save`, so it keeps the same voice every time.

1. `pnpm video new my-story --story` creates the project with a `voices/` folder and a `dialogue.json`.
2. Put one recording per line in `voices/` and list them in `dialogue.json` (below).
   `text` must be the exact recorded words.
3. `pnpm video plan my-story` assembles the clips and analyses them. If a recording is missing,
   it lists all of them. It then writes `build/brief.md`, showing every clip's number and speaker.
4. Direct `storyboard.json` (below). Time things with `clip:N`, so new takes need no retiming.
5. `pnpm video validate my-story`, then `pnpm video check my-story`, then look at the frames.
6. `pnpm video make my-story` renders the 60 fps Shorts video.

After replacing a recording, run `plan` again; the other commands refuse to use stale audio.
`projects/unluckiest-thief` is a complete directed example, and `examples/story-mode/` keeps a copy of
its storyboard, the recording list and the source script.

## dialogue.json

```json
{
  "cast": {
    "bob": {"preset": "thief", "name": "Bob"},
    "officer": {"preset": "policeman"},
    "dog": {"kind": "dog"}
  },
  "clips": [
    {"who": "narrator", "file": "voices/01.wav", "text": "Meet Bob."},
    {"who": "bob", "file": "voices/02.wav", "text": "Easy money!", "gap": 0.5},
    {"who": "dog", "file": "voices/03.wav", "text": "[bark]", "gainDb": -3}
  ]
}
```

- Clips play in order, with a 0.25 s `gap` by default. A longer gap makes a dramatic pause.
  `start` sets an absolute second instead. Voices cannot overlap yet; sound effects can.
- `who` is `narrator`, `none` or a cast id. The clip being played decides whose mouth moves, and
  it overrides `scene.speaker`. The storyboard's `cast` needs the same ids.
- `gainDb` is optional, for a recording that is louder or quieter than the others.
- A clip whose whole text is in brackets, such as `[bark]`, is a sound: it is heard but never captioned.
- Recordings are decoded and placed, never stretched, and the originals are not changed.

## Timing that follows the voice

Anywhere a time is allowed, these work as well as seconds and `"@word"`:

| Write | Means |
|---|---|
| `"clip:12"` | when recording 12 starts |
| `"clip:12:end"` | when it ends |
| `"clip:12+0.4"`, `"clip:12:end-0.5"` | that moment, shifted in seconds |

Use `"start": "clip:12"` for a scene: it owns that clip's words, so `"@word"` keeps working.

## Scale and layers: read this before staging

Most staging mistakes come from sizing a thing to fill the frame instead of sizing it against the world.

**Keep one scale per story.** `size` is a fraction of the frame width, and a person is about that tall.

| Thing | `size` | Why |
|---|---|---|
| Person beside a building (`house_exterior`, `street`, `schoolyard`, `farm`) | 0.36–0.42 | Must look like they fit through the door |
| Person indoors | 0.45–0.52 | Taller than the table, shorter than the cupboard |
| Cupboard | about 0.66 | Taller than a person |
| Table | about 0.4 | Reaches a person's waist |
| Car | about 0.5 | About as tall as a person |
| "Huge" animal | 0.55–0.7 | 1.5× the person next to it, and all of it stays in the frame |

- **A close-up is a camera move.** Use `"camera": {"zoom": [1.3, 1.5], "focus": {"x": 0.5, "y": 0.86}}`.
  Zoom scales the whole picture, so the proportions hold. Never enlarge an actor for a close-up.
  Put `focus` near the actor's feet, so the actor grows upward and stays clear of the captions.
- **"Gigantic" is a comparison.** Make the other actor smaller and keep the whole animal in the frame.
  A size above 0.7 crops it, and then the viewer cannot see how big it is.
- Keep an actor's size the same between connected shots, and put props at the same scale as the actors.

**Decide the layers before writing `zIndex`.** List the scene from back to front, the same way as CSS z-index:

| Layer | `zIndex` |
|---|---|
| Background | fixed, always at the back |
| Things behind the actors: furniture, windows, broken pots | 3–4 |
| Actors, with their emotes | 5 |
| Things that hide an actor on purpose: a cupboard they run behind, a car they stand behind | 6 |
| Effects that belong on top: slobber, an alarm light | 7 |

- **The main actor's face is never covered**, unless the point of the shot is that they are hidden.
- **An emote belongs to its actor's layer.** Stars, sweat and "Zz" go behind anything with a higher `zIndex`,
  so put objects the actor lands on *behind* the actor. Bob lands in the pot: pot at 4, Bob at 5, and his stars show.
- A rotated actor turns around the feet. After a head-first fall, set `y` so the head rests on the ground.

`pnpm video validate` warns about actors out of scale and props in front of an actor with an emote. It cannot
judge everything, so look at the start, middle and end of each shot and ask: what is in front of what, and does
everything look the right size next to its neighbours?

## Pacing: keep the audio tight

**The voice is the source of truth for speed.** Its pace is never changed to fit the picture: no
slowing, speeding up or stretching, and no slower TTS style chosen to fill time. The picture is fitted
to the voice instead: scene lengths, moves (`until`), holds and cuts. The video is never shorter than
the voice; it may run longer when a beat needs it (storyboard `"endHold": 1.5`, seconds after the
voice ends, or a longer `"duration"`). A 30 s voice makes a video of 30 s or more.

So slow or padded audio makes the whole video long and slow.

- **Trim every recording.** Cut the silence at its start and end before adding it. The pipeline never trims or
  stretches recordings, so any padding stays in the video, and with dozens of clips it adds up quickly.
- **Use a brisk voice.** Ask the voice tool for a natural, slightly quick delivery. Comedy needs speed.
- **Keep gaps short.** Use `"gap": 0.1`–`0.25`, and join neighbouring narrator lines into one recording.
  Save long gaps for the few pauses that earn it, such as the one before a punchline.
- **Keep sound effects short.** One should finish before the next line starts, usually in under a second.
  A long effect such as `siren` needs a matching gap in the dialogue.

A Short has no target length: it can run past 60 seconds when the story needs it. The aim is no wasted time.
The Bob example feels slow because its Windows placeholder voices are slow and padded.

## Actors

Human presets: `thief`, `policeman`, `farmer`, `schoolgirl`, plus every other preset in `pnpm video catalog`.
Costume pieces are listed there too (`look.hat`, `outfit`, `accessory`, `hair`, `shirtSymbol`).
A name with no drawing is a validation error.

- `cast.<id>.look` is the actor's permanent design.
- `characters[].look` applies for one scene.
- `actions[].look` is a change on a word, and `actions[].holding` picks something up (`""` puts it down):

```json
{"at": "@mask", "who": "bob", "look": {"accessory": "mask"}},
{"at": "@tools", "who": "bob", "holding": "tool_bag", "pose": "hold"}
```

Animals use `"kind": "dog" | "cat" | "bird"`. These actors are different from the static `dog`, `cat`
and `bird` props. Their poses are `idle talk walk run sit sleep jump lick bark scared celebrate cheer fly`.
`look.skin` is the main colour, `look.accent` the collar or beak, `look.shirt` the belly or wing, and
`look.hairColor` the ears or stripes. They show emotes, and `holding` puts the prop in the mouth.
A dog at `size` 0.62 fills about two-thirds of the frame width.

## Places

Use `"layout": "story"`. Actors stand on the floor of the setting by default. `x` and `y` are fractions
of the frame, with `y` at the feet. `size` is relative to the frame width.

Story settings: `living_room`, `house_exterior`, `park`, `schoolyard`, `street`. They have a time of day:

```json
"bg": {"type": "street", "time": "night"}
```

`time` is `day`, `dusk` or `night`; windows and lamps light up. `office`, `classroom`, `kitchen`, `farm`,
`forest`, `lab`, `city` and the others also work, in their one daytime look. Keep the same place across
connected beats.

Furniture and story objects: `cupboard`, `cupboard_open`, `table`, `door`, `stairs`, `open_window`, `flower_pot`,
`broken_pot`, `nail`, `police_car`, `school_bus`, `loot_bag`, `tool_bag`, `alarm_light`, `hay_bale`, `slobber`.
Add `"anchor": "bottom"` and they stand on `y`. In a story shot, a prop with both `x` and `y` stays exactly
where you put it, even off screen. Swap two props on a word with `out` and `at` (see `the-fall` in the example).

## Movement

Characters and props take the same `move` list:

```json
"move": [
  {"at": "@falls", "until": "@pot", "x": 0.36, "y": 0.56, "rotate": 172, "arc": 0.03, "ease": "power2.in"}
]
```

| Field | Meaning |
|---|---|
| `at` | when it begins |
| `duration` or `until` | seconds, or the word or clip to arrive on |
| `x`, `y` | destination, as fractions of the frame; beyond 0–1 is off screen |
| `pose` | `walk` (default) or `run` |
| `arc` | height of a jump, as a fraction of the frame height |
| `steps` | climb in this many equal steps, with `arc` as the height of each hop; add `"pose": "walk"` |
| `rotate` | degrees to end at, for falls and tumbles |
| `ease` | `sine.inOut` (default), `linear`, `power2.in`, `power2.out`, `power3.in`, `back.out` |
| `facing` | actors turn to their direction of travel; set `left`, `right`, or `keep` to walk backwards |

A move with `arc` or `rotate` keeps the actor's current pose instead of walking. Moves run in order. If a
faster take makes one reach into the next, the earlier one is shortened and `make` prints a warning.

`zIndex` sets the depth: actors default to 5 and props to 4. Put a cupboard at 6 and an actor walks behind
it; add `out` to remove the actor once hidden. Movement is not pathfinding, so plan the route yourself.

## Sound

The usual `sfx` list, plus story sounds: `alarm`, `siren`, `bark`, `slurp`, `crash`, `rip`, `creak`, `skid`.
Set the mood in `video.json`, for example `"music": "epic"`. There is one mood per video for now.

## Titles and checks

Story titles sit below the caption band. `pnpm video check` still enforces text and captions, but it does
not flag overlaps and off-screen actors in story shots, because those are deliberate. Look at each move's
start, middle and end, and at costume changes, entrances and speaker changes.

## Two languages

Put `dialogue-ar.json` next to `dialogue.json`: the same lines in the same order, each with its own
Arabic recording (for example `voices-ar/01.wav`). Then follow the normal steps with
`pnpm video localize my-story --lang ar`. Moves and speakers follow the Arabic recordings.

## Demo

`pnpm studio` → **StoryModeDemo** is a short silent tour of actors and places. It is not a finished video.
