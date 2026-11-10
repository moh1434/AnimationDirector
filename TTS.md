# Voices from text (Audar-TTS Turbo, Qwen3-TTS)

**One AI model at a time.** This laptop crashes if two models run together. Never run TTS, whisper or renders in parallel; wait 15 s after each generation before starting the next. Read [MODEL_SAFETY.md](MODEL_SAFETY.md).

Use this when the user sends a **script but no recordings**, or when a story needs a voice for a
character nobody recorded. The director gives each character a voice (a saved one, a reference to
clone, or a description), the models make a few takes of each one locally, the user listens and picks
one per character, and the picked takes become the video's recordings. Everything runs on this PC
(each model in its own Python environment, on the GPU). No cloud service is called.

When the user supplies recordings, use them instead (STORY_MODE.md or the normal narration path).

**Voices come only from inside this folder:** the user's recordings in the project, `voices-library/`,
or a voice designed here from a description. Never use, copy or clone a WAV from another folder
(`..\TTS_comparison\references\`, the models' own sample voices, …), even where another instruction
file lists it. `voices` refuses a `reference` or `file` outside the project and `voices-library/`;
copying it in is just as forbidden.

**The voice sets the speed of the video.** Takes are never slowed down, sped up or stretched to fit
the picture; the storyboard is fitted to the voice, and the video may run longer than the voice, never
shorter (STORY_MODE.md, "Pacing").

## Two engines

| | Audar-TTS Turbo (`audar`, the default) | Qwen3-TTS 1.7B (`qwen3`) |
|---|---|---|
| Makes a voice from | a **reference recording** (5–15 s) + its exact words | a **description** (VoiceDesign weights), or a reference (Base weights) |
| Languages | **English and Arabic** (and code-switching) | **English only** |
| Strong at | cloning a saved voice, in both languages | inventing a new voice for a new character |
| Tags | `[laughs]` `[curious]` `[excited]` `[sighs]` `[exhales]` `[mischievously]` `[whispers]` `[sarcastic]` | none (the delivery goes in the description) |
| Guide | [docs/tts/audar-turbo/README.md](docs/tts/audar-turbo/README.md) | [docs/tts/qwen3-tts/README.md](docs/tts/qwen3-tts/README.md) |

Which engine a voice uses, when it does not say `"engine"`:

- `library` or `reference` → **Audar** clones it (English or Arabic). `"engine": "qwen3"` clones with
  Qwen3-TTS instead (English only).
- `description` in an English video → **Qwen3-TTS** designs the voice.
- `description` in an Arabic video → Qwen3-TTS first designs a short **English reference** from the
  description (`voice-takes/<lang>/<who>/design-*.wav`), then **Audar** clones it to speak the Arabic lines.

So a **new** character starts from a description. Once the user has picked a take, a short piece of it
can be saved as the character's reference (`voice-ref --save`, below), and every later video clones it,
in English and in Arabic. Each voice may set `"engine"`; one story can mix them.

## Why one take per character

A voice made from a description is **a different person in every separate generation**. So each
character speaks **all of their lines in one take**, in script order:

- a **designed** take (Qwen3-TTS from a description) is one generation holding every line;
- a **cloned** take (Audar, or Qwen3-TTS Base) is made a few whole lines at a time (Audar makes at most
  ~36 s per generation) from the same reference, and the parts are joined with a short pause. The
  reference keeps it the same person from part to part.

After the user picks a take, `voice-pick` cuts it back into lines, in the pauses between them, and puts
the lines back in script order:

```
script          Ali → Ahmed → Ali → Narrator → Ahmed
takes           Ali: line 1 + line 3       Ahmed: line 2 + line 5       Narrator: line 4
after the pick  voices/01-ali.wav, 02-ahmed.wav, 03-ali.wav, 04-narrator.wav, 05-ahmed.wav
```

Cutting only removes the silence between lines: speech is never stretched, sped up or re-timed.

## Before you start

Read the guide of each engine you use first (`docs/tts/…`). `.env` must name each model's folder (see
`.env.example`); each folder holds its `.venv` and weights. `pnpm video doctor` checks them:

```env
TTS_AUDAR_DIR="C:/Users/lenovo/tts-new-models/audar-turbo"
TTS_QWEN3_DIR="C:/Users/lenovo/tts-new-models/qwen3-tts"
```

The models run through `uv` (`uv run --no-sync --project <folder> python -I pipeline/tts_workers/…`);
set `TTS_UV` if `uv` is not on the PATH. whisper.cpp must be on as well (`WHISPER_PATH` and a model for
the language): it checks every take word by word and gives the times needed to cut it.

## Steps

1. `pnpm video new my-story --tts` makes the project with a `tts.json` to fill in.
2. Fill in `tts.json` from the user's script (below). Never change the user's words.
3. `pnpm video voices my-story` makes the takes, one generation at a time with a 15 s rest between them,
   and writes `voice-takes/en/review.html`: every character's takes side by side, with what the word
   check found.
4. **Send the review page to the user and ask them to pick one take per character.** Never pick for
   them, by duration, by the check or by taste. If they like none of a character's takes, change that
   voice or add takes, and run `voices --only <who>` (the other characters' takes are kept).
5. `pnpm video voice-pick my-story ali=2 ahmed=1 narrator=3` with the user's choices. It writes:
   - several voices, or any sound line: `dialogue.json` + `voices/01-ali.wav`, `02-ahmed.wav`, …
   - one voice that speaks everything: `voice.wav` (the take, whole, with its natural pauses) +
     `script.txt` (the time of each line).
6. Read what `voice-pick` printed (below), then add the `cast` to `dialogue.json` and carry on as
   usual: `pnpm video plan my-story`, direct, validate, check, enhance, make (CLAUDE.md, STORY_MODE.md).

## tts.json

```json
{
  "language": "en",
  "takes": 3,
  "voices": {
    "narrator": { "library": "narrator" },
    "ali": { "description": "An energetic young man with a bright, slightly high, cheerful cartoon voice, quick and playful" },
    "ahmed": { "reference": "refs/ahmed.wav", "referenceText": "The exact words spoken in ahmed.wav.", "seeds": [5, 17, 29] }
  },
  "lines": [
    { "who": "narrator", "text": "Ali found a strange box in the garden." },
    { "who": "ali", "text": "Ahmed! Come and look at this!" },
    { "who": "ahmed", "text": "What is it now?", "say": "[sighs] What is it now?" },
    { "who": "dog", "text": "[bark]", "file": "sounds/bark.wav" }
  ]
}
```

| Field | Meaning |
|---|---|
| `language` | the script's language (`en` or `ar`), used for the models and whisper's check |
| `takes` | takes per character, 1–8 (default 3). A voice can set its own `takes` |
| `voices.<who>.engine` | `audar` or `qwen3`; usually left out (see "Which engine" above) |
| `voices.<who>.description` | a new voice, in English: who, texture, delivery (below) |
| `voices.<who>.reference` + `referenceText` | a recording in the project to clone, and its exact words |
| `voices.<who>.library` | a character voice saved in `voices-library/`; brings its own reference per language |
| `voices.<who>.seeds` | optional seeds, one per take (default 11, 22, 33, …). Same seed + same text = same audio |
| `voices.<who>.alternatives` | optional list of other setups for the same character (another `engine`, `description` or `reference`), each 1 take unless it sets `takes`. Their takes are numbered after the main takes, which stay valid. An alternative may give `"say": {"<line number>": "..."}` for its own wording (e.g. Audar tags). 8 takes at most in all |
| `voices.<who>.options` / `options` | Audar: `temperature` (default 0.8; 0.6–0.7 steadier, 1.0 most expressive), `top_k`, `top_p`, `repeat_penalty` (keep ≈1.1, higher suppresses laughter). Qwen3-TTS: `temperature`, `top_k`, `top_p` |
| `lines[].who` | a lower-case id; the same ids go in the storyboard's `cast` |
| `lines[].text` | the **exact** words of the script; captions and lip-sync use these |
| `lines[].say` | optional: the same words with Audar tags or different punctuation, for the model |
| `lines[].file` | optional: the user's own recording of this line (or a sound) instead of a take |

`"script": "story.txt"` can replace `lines`: one `Who: words` line each (no `say` then).

### Splitting the script into lines

- One entry each time the speaker changes, in script order. A character's line that is quoted in
  the narration becomes its own line: `He whispers: "Easy money!"` →
  narrator `He whispers:` + bob `Easy money!`.
- A long speech by one character can stay one line, or be split at sentences when scenes need to cut
  inside it (each line becomes one clip, and storyboards time scenes with `clip:N`). Keep each line
  under ~200 characters for Audar (one line is never split across two generations).
- A sound (`[bark]`, `[crash]`) is its own line with its own `who`. It is not generated: give it a
  `file`, or `voice-pick` lists it as still missing.

### Describing voices (Qwen3-TTS)

- Three layers: **who** (age, gender, role) · **texture** (pitch, timbre: deep, raspy, bright,
  nasal) · **delivery** (mood, pace, situation: "grumpy and slow", "like a cartoon sidekick").
- Make the characters easy to tell apart: different ages, pitches and paces.
- The description sets the delivery of the **whole take**; for one line use punctuation (`!`, `?`,
  `...`). Qwen3-TTS has no inline tags: `voices` refuses `[...]` in its lines.
- Write it in English, also for an Arabic video (it designs the English reference Audar clones).

### Tags (Audar)

Audar understands eight tags inside a line's `say`: `[laughs]` `[curious]` `[excited]` `[sighs]`
`[exhales]` `[mischievously]` `[whispers]` `[sarcastic]`, in English and Arabic. Use one, at most two,
per line; other tags are refused. `say` must keep the same words as `text`: only tags, punctuation and
capitals may differ, and no parentheses.

## Reading the results

`voices` prints one line per take, for example `ali take 2: 6.1 s, all 3 line(s) heard`, and
`review.html` lists, under each take, any line whisper heard differently:

- `line 4 missing: doggy` — a word may be skipped or mispronounced. Listen to it.
- A name heard with another spelling ("Ally" for Ali) is usually fine: listen and judge.
- A tag such as `[sighs]` may be heard as "Ah". That is the sigh, not an error.
- `extra word(s)` — the model may have repeated a word.
- A whole line missing in a long designed take: the model skipped it. Pick another take.

`voice-pick` listens to every cut line again and warns only when a line contains a word from the
line next to it in the take (`it has "spiders" from line 7, so a cut is in the wrong place`).
Listen to both lines. If the cut really is wrong, pick another take of that character, or change the
punctuation at the end of the earlier line so the model pauses longer, and make new takes.

Changing a voice, a line or a seed makes new takes on the next `voices` run. The replaced takes are
moved into `voice-takes/<lang>/<who>/old/`, never deleted. `voice-pick` refuses a take made from an
older `tts.json`, so what the user heard is what goes into the video.

## Files

| File | Written by | Notes |
|---|---|---|
| `tts.json`, `tts-ar.json` | the director | the script and the voices |
| `voice-takes/<lang>/<who>/take-N.wav` + `.json` | `voices` | each take, its text, seed and word check |
| `voice-takes/<lang>/<who>/design-*.wav` | `voices` | an English reference Qwen3-TTS designed for Audar to clone |
| `voice-takes/<lang>/review.html` | `voices` | the page the user listens on |
| `voice-takes/<lang>/picked.json` | `voice-pick` | what was picked and which files it wrote |
| `dialogue.json` + `voices/` (or `voice.wav` + `script.txt`) | `voice-pick` | the recordings the video uses |
| `refs/<who>.wav` + `.json` | `voice-ref` | a reference cut from a take, with its exact words |
| `voices-library/<id>/reference_<lang>.wav` + `voice.json` | `voice-ref --save` (or the user) | a character voice for every video, one reference per language (outside the projects) |

`voice-pick` never overwrites a file it did not write (the user's own recordings, or a `dialogue.json`
made by hand): it stops and changes nothing. `--replace` overwrites anyway, so use it only when the
user agrees. Picking again keeps the `cast` the director added to `dialogue.json`, and each clip's
`gap`, `gainDb` and `start` when its line is unchanged.

Between two lines of the same character that follow each other, `dialogue.json` keeps the natural
pause from the take (0.15–0.8 s). Between different speakers the usual 0.25 s `gap` applies; change
it for a dramatic pause. `--dialogue` makes `dialogue.json` even for a single voice.

## Two languages

1. Write `tts-ar.json`: the **same lines in the same order**, with the user's Arabic words and
   `"language": "ar"`. Leave out `voices` to reuse the English ones: a `library` voice uses its
   `reference_ar.wav` (or its English one), and a description becomes a designed English reference
   that Audar clones in Arabic.
2. `pnpm video voices my-story --lang ar`, send `voice-takes/ar/review.html`, and ask for the picks.
3. `pnpm video voice-pick my-story --lang ar ali=1 ahmed=3 narrator=2` writes `dialogue-ar.json` +
   `voices-ar/` (or `voice-ar.wav` + `script-ar.txt`).
4. `pnpm video localize my-story --lang ar`, as in CLAUDE.md.

For the same person in both languages, clone one reference (a `library` voice) in both. Keep brand
names in Latin letters (ChatGPT, Godot).

## Cloning and the character library

1. After the user picks a take, cut a reference from it:
   `pnpm video voice-ref my-story ali=2`. It picks whole lines of that take, about 5–12 s, preferring
   lines whose words were heard right and that have no tags, and writes `refs/ali.wav` and
   `refs/ali.json` with the exact words. It prints the `voices` entry to use:
   `"ali": { "reference": "refs/ali.wav", "referenceText": "…" }` (Audar; add `"engine": "qwen3"` for
   Qwen3-TTS, English only).
2. **A character who will come back** is saved once: `pnpm video voice-ref my-story ali=2 --save ali`
   copies the reference into `voices-library/ali/` as `reference_<lang>.wav` (the take's language) and
   writes its words to `voice.json` as `"referenceText_<lang>"`; saving another language adds to the same
   folder. Any later video then writes `"ali": { "library": "ali" }` and gets the reference in its own
   language (another one, English first, when that language has none; `voices` warns). `--save` never
   replaces a saved language: other videos depend on it. Use `--overwrite` only when the user agrees.
   Format: `voices-library/README.md`.

Only clone voices the user has the right to use.

## New characters and adding a voice to a story

**When the director draws a new character who speaks**, that character needs a voice nobody recorded:

1. Check `voices-library/` first. A character saved there keeps its voice: use `{ "library": "<id>" }`.
2. Otherwise describe one that **matches the drawing**: a small child or a bird gets a high, quick
   voice; a big guard or a bear a deep, slow one; a grumpy shopkeeper sounds grumpy. Make it easy to
   tell apart from the others in the story.
3. Make takes, send `review.html`, and wait for the user's pick, as usual. Offer to save a character who
   may come back (`voice-ref --save`).

**Adding a voice to a story made of the user's recordings** (a `dialogue.json` they wrote): write
`tts.json` with every clip of their `dialogue.json` as a line with its `file`, in the same order, plus
the new character's lines where they belong:

```json
{
  "language": "en",
  "voices": { "shopkeeper": { "description": "A cheerful, round middle-aged man with a warm, slightly deep voice" } },
  "lines": [
    { "who": "bob", "text": "Easy money!", "file": "voices/01-bob.wav" },
    { "who": "shopkeeper", "text": "Can I help you?" },
    { "who": "bob", "text": "Just looking.", "file": "voices/03-bob.wav" }
  ]
}
```

Only lines without a `file` are generated. `voice-pick` then rewrites `dialogue.json` with the new
clips in place, keeping every one of the user's recordings, its `gap`, `gainDb`, `start` and the
`cast`; the old `dialogue.json` is kept as `voice-takes/<lang>/dialogue.before.json`. If `tts.json`
leaves out or changes any of the user's clips, `voice-pick` refuses and changes nothing. The new
character's clips are named after their place in the script (`voices/02-shopkeeper.wav`) and never
replace a file of the user's.

## Limits

- **One delivery per take.** A character who whispers in one line and shouts in the next gets the
  voice's delivery for both, nudged by Audar tags and punctuation. For a very different line, the user
  can record it and give that line a `file`.
- **Long designed takes.** A designed take is one generation; over ~1400 characters `voices` warns:
  listen to the last lines.
- **Qwen3-TTS speaks English only**, and Audar only clones; `voices` refuses both mistakes.
- **Whisper's check is a guide, not proof.** It can mishear names and short lines. The user's ears decide.
- **Pacing.** Clips are trimmed to the speech, and their speed is never changed: the picture follows the
  voice (STORY_MODE.md, "Pacing"). If a voice is too fast or too slow for the character, change it and
  make new takes for the user to pick from.
- Voices cannot overlap yet (dialogue plays one clip at a time).

## Commands

```powershell
pnpm video new my-story --tts                          # project with a tts.json to fill in
pnpm video voices my-story [--lang ar] [--only ali,ahmed] [--dry-run]
pnpm video voice-pick my-story ali=2 ahmed=1 [--lang ar] [--replace] [--dialogue]
pnpm video voice-ref my-story ali=2 [--lang ar] [--save ali] [--overwrite]   # a clone reference (+ library)
```

`--dry-run` lists the takes that would be made, without running a model.

## Sample projects

`projects/voice-test` and `projects/cosy-test` were made with the earlier engines (VoxCPM2,
CosyVoice3), which are no longer installed in this pipeline. Their recordings still work in a video;
to make new takes, change their `tts.json` voices to the engines above.
