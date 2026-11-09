# Voices from text (VoxCPM2, CosyVoice3)

**One AI model at a time.** This laptop crashes if two models run together. Never run TTS, whisper or renders in parallel; wait 15 s after each generation before starting the next. Read [MODEL_SAFETY.md](MODEL_SAFETY.md).

Use this when the user sends a **script but no recordings**, or when a story needs a voice for a
character nobody recorded. The director describes a voice for each character, the model makes a few
takes of each one locally, the user listens and picks one per character, and the picked takes become
the video's recordings. Everything runs on this PC (audio-cpp on the GPU). No cloud service is called.

When the user supplies recordings, use them instead (STORY_MODE.md or the normal narration path).

**Voices come only from inside this folder:** the user's recordings in the project, `voices-library/`,
or a voice designed here from a description. Never use, copy or clone a WAV from another folder
(`..\TTS_comparison\references\`, audio-cpp samples, …), even where another instruction file lists
it. `voices` refuses a `reference` or `file` outside the project and `voices-library/`; copying it in
is just as forbidden.

**The voice sets the speed of the video.** Takes are never slowed down, sped up or stretched to fit
the picture; the storyboard is fitted to the voice, and the video may run longer than the voice, never
shorter (STORY_MODE.md, "Pacing").

## Two engines

| | VoxCPM2 (default) | CosyVoice3 |
|---|---|---|
| Makes a voice from | a **description** ("a deep, gruff old man"), or a reference recording | a **reference recording only** |
| Languages | 30, Arabic included | en, zh, ja, ko, de, es, fr, it, ru (**no Arabic**) |
| Strong at | inventing a new voice for a new character | cloning closest and most consistently; fast |
| Delivery per voice | the description | `style`: loud, soft, fast, slow, happy, sad, angry |
| Tags | `[laughing]` `[sigh]` `[Uhm]` … | `[laughter]` `[breath]` `[sigh]` … and `<strong>word</strong>` |
| Guide | [docs/tts/VoxCPM2-GGUF/README.md](docs/tts/VoxCPM2-GGUF/README.md) | [docs/tts/CosyVoice3-GGUF/README.md](docs/tts/CosyVoice3-GGUF/README.md) |

So a **new** character starts with VoxCPM2 (a description). Once the user has picked a take, a short
piece of it can be the reference for CosyVoice3 or for a VoxCPM2 clone (`voice-ref`, below), which keeps
that character the same person in later videos. Each voice picks its engine with `"engine"`; one story
can mix them.

## Why one long take per character

A voice made from a description is **a different person in every separate generation**. The model
guide measured this: a speaker similarity of 0.40 across sentences, where about 0.25 means different
people. Making each line on its own would give Ali a new voice every time he speaks.

So each character speaks **all of their lines in one take**, in script order: the voice stays the
same person from the first line to the last. After the user picks a take, `voice-pick` cuts it back
into lines, in the pauses between them, and puts the lines back in script order:

```
script          Ali → Ahmed → Ali → Narrator → Ahmed
takes           Ali: line 1 + line 3       Ahmed: line 2 + line 5       Narrator: line 4
after the pick  voices/01-ali.wav, 02-ahmed.wav, 03-ali.wav, 04-narrator.wav, 05-ahmed.wav
```

Cutting only removes the silence between lines: speech is never stretched, sped up or re-timed.
Cloning is not needed for any of this; it is optional (see "Cloning" below).

## Before you start

Read the full guide of each engine you use first (how to write descriptions, which tags work, what
goes wrong). They are copies of the guides in the model folders.

`.env` must name the program and the model of each engine used (see `.env.example`);
`pnpm video doctor` checks them:

```env
TTS_EXECUTABLE="C:/Users/lenovo/audio-cpp/bin/audiocpp_cli.exe"
TTS_VOXCPM2_MODEL="C:/Users/lenovo/audio-cpp/models/VoxCPM2-GGUF/voxcpm2-q8_0.gguf"
TTS_COSYVOICE3_MODEL="C:/Users/lenovo/audio-cpp/models/CosyVoice3-GGUF/cosyvoice3-q8_0.gguf"
```

whisper.cpp must be on as well (`WHISPER_PATH` and a model for the language): it checks every take
word by word and gives the times needed to cut it.

## Steps

1. `pnpm video new my-story --tts` makes the project with a `tts.json` to fill in.
2. Fill in `tts.json` from the user's script (below). Never change the user's words.
3. `pnpm video voices my-story` makes the takes (a short take and its word check take about 15 s) and writes
   `voice-takes/en/review.html`: every character's takes side by side, with what the word check found.
4. **Send the review page to the user and ask them to pick one take per character.** Never pick for
   them, by duration, by the check or by taste. If they like none of a character's takes, change that
   description or add takes, and run `voices --only <who>` (the other characters' takes are kept).
5. `pnpm video voice-pick my-story ali=2 ahmed=1 narrator=3` with the user's choices. It writes:
   - several voices, or any sound line: `dialogue.json` + `voices/01-ali.wav`, `02-ahmed.wav`, …
   - one voice that speaks everything: `voice.wav` (the take, whole, with its natural pauses) +
     `script.txt` (the time of each line).
6. Read what `voice-pick` printed (below), then add the `cast` to `dialogue.json` and carry on as
   usual: `pnpm video plan my-story`, direct, validate, check, make (STORY_MODE.md).

## tts.json

```json
{
  "language": "en",
  "takes": 3,
  "voices": {
    "narrator": { "description": "A deep, warm, middle-aged male storyteller with a calm, cinematic narration style" },
    "ali": { "description": "An energetic young man with a bright, slightly high, cheerful cartoon voice, quick and playful" },
    "ahmed": { "description": "A deep-voiced, gruff older man with a low, slow, grumpy baritone voice", "seeds": [5, 17, 29] }
  },
  "lines": [
    { "who": "narrator", "text": "Ali found a strange box in the garden." },
    { "who": "ali", "text": "Ahmed! Come and look at this!" },
    { "who": "ahmed", "text": "What is it now?", "say": "[sigh] What is it now?" },
    { "who": "dog", "text": "[bark]", "file": "sounds/bark.wav" }
  ]
}
```

| Field | Meaning |
|---|---|
| `language` | the script's language (`en`, `ar`, …), used for whisper's check |
| `takes` | takes per character, 1–8 (default 3). A voice can set its own `takes` |
| `voices.<who>.engine` | `voxcpm2` (default) or `cosyvoice3` |
| `voices.<who>.description` | VoxCPM2: the voice, in English (it works for Arabic speech too). No parentheses |
| `voices.<who>.reference` + `referenceText` | a recording in the project to clone, and its exact words (below) |
| `voices.<who>.library` | a character voice saved in `voices-library/` (below); brings its own reference |
| `voices.<who>.style` | CosyVoice3 only: `loud`, `soft`, `fast`, `slow`, `happy`, `sad` or `angry` for the whole take |
| `voices.<who>.seeds` | optional seeds, one per take (default 11, 22, 33, …). Same seed + same text = same audio |
| `voices.<who>.alternatives` | optional list of other setups for the same character (another `engine`, `description` or `reference`), each 1 take unless it sets `takes`. Their takes are numbered after the main takes, which stay valid. An alternative may give `"say": {"<line number>": "..."}` for its own wording (e.g. sentence case for CosyVoice3). 8 takes at most in all |
| `voices.<who>.options` / `options` | VoxCPM2: `num_inference_steps` (default 4), `guidance_scale` (keep ≥ 1.5), `retry_badcase`. CosyVoice3: `num_inference_steps` (default 4), `top_k` |
| `lines[].who` | a lower-case id; the same ids go in the storyboard's `cast` |
| `lines[].text` | the **exact** words of the script; captions and lip-sync use these |
| `lines[].say` | optional: the same words with VoxCPM2 tags or different punctuation, for the model |
| `lines[].file` | optional: the user's own recording of this line (or a sound) instead of a take |

`"script": "story.txt"` can replace `lines`: one `Who: words` line each (no `say` then).

### Splitting the script into lines

- One entry each time the speaker changes, in script order. A character's line that is quoted in
  the narration becomes its own line: `He whispers: "Easy money!"` →
  narrator `He whispers:` + bob `Easy money!`.
- A long speech by one character can stay one line, or be split at sentences when scenes need to cut
  inside it (each line becomes one clip, and storyboards time scenes with `clip:N`).
- A sound (`[bark]`, `[crash]`) is its own line with its own `who`. It is not generated: give it a
  `file`, or `voice-pick` lists it as still missing.

### Describing voices

Follow §2 of the model guide. In short:

- Three layers: **who** (age, gender, role) · **texture** (pitch, timbre: deep, raspy, bright,
  nasal) · **delivery** (mood, pace, situation: "grumpy and slow", "like a cartoon sidekick").
- Male voices need "deep", "low-pitched" or "baritone", or they often come out high.
- Make the characters easy to tell apart: different ages, pitches and paces.
- The description sets the delivery of the **whole take**. For one line that needs a different feel,
  use punctuation (`!`, `?`, `...`) and at most one or two tags in `say`:
  `[laughing]` `[sigh]` `[Uhm]` `[Shh]` `[Question-ah]` `[Question-ei]` `[Question-en]`
  `[Question-oh]` `[Surprise-wa]` `[Surprise-yo]` `[Dissatisfaction-hnn]`. Other models' tags
  (`[laughs]`, `(laughs)`) are refused, because the model would not understand them.
- `say` must keep the same words as `text`: only tags, punctuation and capitals may differ. The check
  refuses anything else, and parentheses (a `(style)` only works once, at the start of the take, which
  is what the description is).
- **CosyVoice3 has its own tags**: `[laughter]` `[breath]` `[sigh]` `[cough]` `[quick_breath]` … and
  `<strong>word</strong>` for stress or `<laughter>words</laughter>`. It spells ALL-CAPS words letter by
  letter ("YOU!" → "Y-O-U"), so `voices` warns about them: give that line a `say` in sentence case
  (acronyms such as NASA stay). Its `style` changes the delivery of the whole take; it is chosen for the
  character, never to make a take longer or shorter for the picture.

## Reading the results

`voices` prints one line per take, for example `ali take 2: 6.1 s, all 3 line(s) heard`, and
`review.html` lists, under each take, any line whisper heard differently:

- `line 4 missing: doggy` — a word may be skipped or mispronounced. Listen to it.
- A name heard with another spelling ("Ally" for Ali) is usually fine: listen and judge.
- A tag such as `[sigh]` may be heard as "Ah" or "Hi". That is the sigh, not an error.
- `extra word(s)` — the model may have repeated a word.

`voice-pick` listens to every cut line again and warns only when a line contains a word from the
line next to it in the take (`it has "spiders" from line 7, so a cut is in the wrong place`).
Listen to both lines. If the cut really is wrong, pick another take of that character, or change the
punctuation at the end of the earlier line so the model pauses longer, and make new takes.

Changing a description, a line or a seed makes new takes on the next `voices` run. The replaced
takes are moved into `voice-takes/<lang>/<who>/old/`, never deleted. `voice-pick` refuses a take
made from an older `tts.json`, so what the user heard is what goes into the video.

## Files

| File | Written by | Notes |
|---|---|---|
| `tts.json`, `tts-ar.json` | the director | the script and the voices |
| `voice-takes/<lang>/<who>/take-N.wav` + `.json` | `voices` | each take, its text, seed and word check |
| `voice-takes/<lang>/review.html` | `voices` | the page the user listens on |
| `voice-takes/<lang>/picked.json` | `voice-pick` | what was picked and which files it wrote |
| `dialogue.json` + `voices/` (or `voice.wav` + `script.txt`) | `voice-pick` | the recordings the video uses |
| `refs/<who>.wav` + `.json` | `voice-ref` | a reference cut from a take, with its exact words |
| `voices-library/<id>/reference.wav` + `voice.json` | `voice-ref --save` | a character voice for every video (outside the projects) |

`voice-pick` never overwrites a file it did not write (the user's own recordings, or a `dialogue.json`
made by hand): it stops and changes nothing. `--replace` overwrites anyway, so use it only when the
user agrees. Picking again keeps the `cast` the director added to `dialogue.json`, and each clip's
`gap`, `gainDb` and `start` when its line is unchanged.

Between two lines of the same character that follow each other, `dialogue.json` keeps the natural
pause from the take (0.15–0.8 s). Between different speakers the usual 0.25 s `gap` applies; change
it for a dramatic pause. `--dialogue` makes `dialogue.json` even for a single voice.

## Two languages

1. Write `tts-ar.json`: the **same lines in the same order**, with the user's Arabic words and
   `"language": "ar"`. Leave out `voices` to reuse the English descriptions (an English description
   works for Arabic speech), or give Arabic-specific ones.
2. `pnpm video voices my-story --lang ar`, send `voice-takes/ar/review.html`, and ask for the picks.
3. `pnpm video voice-pick my-story --lang ar ali=1 ahmed=3 narrator=2` writes `dialogue-ar.json` +
   `voices-ar/` (or `voice-ar.wav` + `script-ar.txt`).
4. `pnpm video localize my-story --lang ar`, as in CLAUDE.md.

The Arabic take of a character is a new generation, so it is a different person from the English
one. That is normal for a dubbed version; when the user wants the same person in both, use cloning.
Keep brand names in Latin letters (ChatGPT, Godot); heavy English inside Arabic is often misread.

## Cloning and the character library

Most single videos do not need cloning. It is for the same person **across videos or languages**:
a recurring character, or the English voice speaking the Arabic version.

1. After the user picks a take, cut a reference from it:
   `pnpm video voice-ref my-story ali=2`. It picks whole lines of that take, about 5–12 s, preferring
   lines whose words were heard right and that have no tags, and writes `refs/ali.wav` and
   `refs/ali.json` with the exact words. It prints the `voices` entry to use.
2. Clone it with either engine:
   - `"ali": { "engine": "cosyvoice3", "reference": "refs/ali.wav", "referenceText": "…" }`: the
     closest clone (zero-shot). Leave out `referenceText` for a cross-lingual clone. Add `"style"` for
     a different delivery with the same voice.
   - `"ali": { "reference": "refs/ali.wav", "referenceText": "…" }`: VoxCPM2's ultimate clone, which
     also works for Arabic.

   A clone has no description, because the model would read it aloud; the voice and much of its
   delivery come from the reference.
3. **A character who will come back** is saved once: `pnpm video voice-ref my-story ali=2 --save ali`
   copies the reference into `voices-library/ali/` (`reference.wav` + `voice.json`). Any later video then
   writes `"ali": { "library": "ali" }`. It clones with CosyVoice3 for the languages it speaks, and with
   VoxCPM2 otherwise (Arabic). Add `"engine"` or `"style"` to change that. `--save` never replaces a
   saved voice: other videos depend on it. Use `--overwrite` only when the user agrees.

Only clone voices the user has the right to use.

## New characters and adding a voice to a story

**When the director draws a new character who speaks**, that character needs a voice nobody recorded:

1. Check `voices-library/` first. A character saved there keeps its voice: use `{ "library": "<id>" }`.
2. Otherwise design one with VoxCPM2 that **matches the drawing**: a small child or a bird gets a high,
   quick voice; a big guard or a bear a deep, slow one; a grumpy shopkeeper sounds grumpy. Make it easy to
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
  description's delivery for both, nudged by tags and punctuation. For a very different line, the
  user can record it and give that line a `file`.
- **Long takes.** About 90 s in one take tested well. Over ~1400 characters `voices` warns: listen
  to the last lines for speeding up or buzzing.
- **Whisper's check is a guide, not proof.** It can mishear names and short lines. The user's ears decide.
- **Pacing.** Takes come out brisk. Clips are trimmed to the speech, and their speed is never changed:
  the picture follows the voice (STORY_MODE.md, "Pacing"). If a voice is too fast or too slow for the
  character, change its description or `style` and make new takes for the user to pick from.
- **CosyVoice3 needs a reference** and does not speak Arabic; `voices` refuses both mistakes.
- Voices cannot overlap yet (dialogue plays one clip at a time).

## Commands

```powershell
pnpm video new my-story --tts                          # project with a tts.json to fill in
pnpm video voices my-story [--lang ar] [--only ali,ahmed] [--dry-run]
pnpm video voice-pick my-story ali=2 ahmed=1 [--lang ar] [--replace] [--dialogue]
pnpm video voice-ref my-story ali=2 [--lang ar] [--save ali] [--overwrite]   # a clone reference (+ library)
```

`--dry-run` lists the takes that would be made, without running the model.

## Sample project

`projects/voice-test` is a worked example: three voices (narrator, Ali, Ahmed) with interleaved lines,
in English (`tts.json` → `dialogue.json`) and Arabic (`tts-ar.json` → `dialogue-ar.json`). Git keeps
only the plans; the takes and clips are not committed. To hear them again, run
`pnpm video voices voice-test` (and `--lang ar`): the same seeds give the same takes, then
`voice-pick voice-test narrator=2 ali=1 ahmed=2` repeats the English picks.
`examples/tts/` holds copies of the two plans.

`projects/cosy-test` is the same story with mixed engines: the narrator is VoxCPM2, while Ali and
Ahmed are CosyVoice3 clones of references cut from their VoxCPM2 takes (`refs/`), Ahmed with
`"style": "angry"`. Its picks were `narrator=2 ali=2 ahmed=2`.
