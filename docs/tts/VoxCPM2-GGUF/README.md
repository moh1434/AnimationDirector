# VoxCPM2 voice guide (audio-cpp, `voxcpm2-q8_0.gguf`)

How to describe voices in natural language, control style, use inline cues, and get a good, consistent voice from VoxCPM2 in this audio-cpp build.

This guide combines two sources:

- **OpenBMB's official documentation** (sources at the end).
- **Measured local tests** on this exact build: `C:\Users\lenovo\Desktop\Ai Influencer\TTS_comparison` (685 clips) and an inline-cue test on 2026-11-08.

Where they disagree, **this build's behaviour wins**, and the disagreement is pointed out.

Facts: 2B parameters, 48 kHz output, 30 languages (including Arabic) plus 9 Chinese dialects, about 3× faster than real time on an RTX 4070 laptop GPU.

---

## 1. Pick the mode


| You want                                                   | Mode                                            | What to pass                                                                                     |
| ---------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| A**new** voice from words, with no audio                   | **Voice design**                                | `--text "(description)Text to speak"`                                                            |
| The**same voice every time**, highest similarity           | **Ultimate clone** (recommended for production) | `--voice-ref ref.wav --reference-text "<exact transcript>" --request-option ultimate_clone=true` |
| A cloned voice speaking**in a different style or emotion** | **Clone + style**                               | `--voice-ref ref.wav --text "(style)Text"`. Do **not** pass `ultimate_clone`.                    |
| A small expressive moment (sigh, "um") inside a line       | **Inline tag** (any mode)                       | `--text "... [sigh] ..."`                                                                        |

> **Rule:** never combine a `(…)` prefix with `ultimate_clone=true`.
>
> - OpenBMB's docs say the instruction is *ignored* in Hi-Fi mode.
> - In this audio-cpp build it is **read aloud** instead. Tested twice: "very excited and happy, laughing, fast" was spoken as words.

Base command (PowerShell):

```powershell
& "$env:USERPROFILE\audio-cpp\bin\audiocpp_cli.exe" --task tts --family voxcpm2 `
  --model "$env:USERPROFILE\audio-cpp\models\VoxCPM2-GGUF\voxcpm2-q8_0.gguf" --backend cuda `
  --text "(A warm, deep, middle-aged male storyteller, calm and cinematic)Every great story starts with a single moment." `
  --request-option seed=22 --out out.wav
```

Add any of the following to that command:

- Clone: `--voice-ref <wav>`
- Ultimate clone: `--voice-ref <wav> --reference-text "<transcript>" --request-option ultimate_clone=true`
- Settings: more `--request-option key=value` (see section 7)

Through the local server (`start-server.ps1`, then `speak.ps1`):

- `-Design "<description>"` is sent as `instructions`.
- `-Ref` and `-RefText` are sent as the voice reference and its transcript.

---

## 2. Writing a voice description (voice design)

**Syntax:** the description goes in parentheses at the very **start** of the text, immediately followed by the words to speak:

```
(A young woman, gentle and sweet voice)Hello, welcome to VoxCPM2!
```

**Official formula: one prompt, three layers.**


| Layer               | What it covers               | Examples                                                                                                       |
| ------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 1. Identity (base)  | gender, age, role            | "elderly woman", "young adult man", "middle-aged police officer"                                               |
| 2. Texture          | pitch, timbre, voice quality | "low-pitched", "deep baritone", "raspy", "breathy", "magnetic", "bright", "nasal", "grainy"                    |
| 3. Delivery (vivid) | emotion, pace, scenario      | "calm and cinematic", "fast and energetic", "like a YouTuber explaining something", "for historical narration" |

Official example:

> (A quiet raspy, elderly woman of a low-pitched voice with a distinct, grainy texture and subtle breathy tremors. Delivers a slow tone at a very low volume, perfect for historical narration.)

### What worked in local tests

- **Be explicit about pitch for male voices.** Without "deep", "low-pitched" or "baritone", designed male voices often came out high, around 220 Hz. Adding those words and trying several seeds fixed it.
- **Long descriptions are fine.** The 710-character `voiceDescription` from `test3.js` (3 sentences) was followed and **never read aloud**. Word error rate was 0–2 % in English and 1–4 % character error rate in Arabic.
- **The language of the description doesn't need to match the speech.** An English description works for Arabic text. Official docs: English and Chinese descriptions are supported.
- **Describe the person and the delivery, not technical audio settings.** Avoid stacking many conflicting instructions; the official advice is to keep it coherent.
- Working examples from the tests:
  - `A deep, warm, middle-aged male storyteller with a calm, cinematic narration style`
  - `A nervous, sly young man with a slightly nasal comedic cartoon voice, mischievous and quick`
  - `A deep-voiced, gruff middle-aged man, a stern police officer with a low, commanding baritone voice`
  - `An energetic, friendly young woman YouTuber with a bright, upbeat and clear voice`
  - `A young adult Arab man with a moderate pitch, a clear, friendly and confident narrator voice` (for Arabic)
  - `A young adult male voice with a warm, friendly, and approachable personality. Medium-pitched, with a smooth, slightly bright tone and clear articulation. Speaks in a relaxed, natural conversational style, with subtle enthusiasm and energy. The delivery is casual and engaging, like a friendly YouTube content creator explaining something interesting to the audience. Use natural intonation, gentle pitch variations, and realistic speech rhythm. The pacing is moderately quick but never rushed. The voice should sound authentic, expressive, and human, not overly polished, theatrical, robotic, or like a traditional radio announcer. Maintain a confident yet laid-back attitude, with a slight smile in the voice.`

### Design is not consistent on its own

The same description gives a **different person per seed and per sentence**:

- Speaker similarity was 0.45 across seeds and 0.40 across sentences, where about 0.25 means different people.
- In test 14, three seeds of one description had median pitches of 123, 150 and 191 Hz.

Official docs also say results vary and suggest generating 1–3 takes. Use design to **create** a voice, then clone it (section 5).

---

## 3. Style control: how the voice speaks

Put a short delivery instruction in parentheses at the start of the text.


| Base                                                       | Works? | Notes                                                                                                                                       |
| ---------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Voice design                                               | ✅     | Mix voice and style in one description:`(A young man, warm voice, speaking very fast and excited)`                                          |
| Clone, audio only (`--voice-ref` without `ultimate_clone`) | ✅     | The reference sets the timbre and the prefix sets the delivery. "very excited and happy, laughing, fast" came out 20 % faster than neutral. |
| Ultimate clone                                             | ❌     | The prefix is**read aloud**. Use inline tags or an emotional reference instead (section 5).                                                 |

Phrases that worked:

- `very excited and joyful, laughing with happiness, fast and energetic`
- `very sad, crying, speaking slowly with a trembling voice`
- `furious and angry, shouting with rage`
- `whispering very quietly and secretively`
- `slightly faster, cheerful tone` (official)
- `Speaking slowly with a whispering, mysterious tone` (official)
- `speaking very fast, bright and full` (official)

Measured strength:

- **With design, styles are strong.** "Sad" was 35 % slower, 6 dB quieter and lower-pitched. "Excited" was faster, louder and higher.
- **With an audio-only clone, some styles barely change.** Whisper and fearful came out the same length as neutral. The reference voice dominates, so listen and adjust.
- **Style changes delivery, not identity.** Official docs: cloning can't do arbitrary identity changes; use it for emotion, speed and delivery.

---

## 4. Inline cues inside the text

Official non-verbal tags go in **square brackets** inside the text:


| Category            | Tags                                                            |
| ------------------- | --------------------------------------------------------------- |
| Laughs and sighs    | `[laughing]` `[sigh]`                                           |
| Pauses and thinking | `[Uhm]` `[Shh]`                                                 |
| Questions           | `[Question-ah]` `[Question-ei]` `[Question-en]` `[Question-oh]` |
| Emotions            | `[Surprise-wa]` `[Surprise-yo]` `[Dissatisfaction-hnn]`         |

Official advice:

- Use tags **sparingly**, at most one or two per sentence, and don't stack them.
- Lowercase forms like `[laughing]` work better than variants like `[Laughter]`.

Results in this build (2026-11-08, clips in `TTS_comparison\VoxCPM2-GGUF\_style_probe\`):


| Cue                         | Design                                                          | Ultimate clone                                      |
| --------------------------- | --------------------------------------------------------------- | --------------------------------------------------- |
| `[Uhm]`                     | ✅ spoken as "um"                                               | not tested                                          |
| `[sigh]`                    | ✅ not read aloud; adds about 1.7 s, an audible sigh or breath  | ✅ adds about 0.8 s; Whisper heard it as "Hi"       |
| `[laughing]`                | not read aloud; no length change, so listen to clip 02 to judge | not read aloud; no length change, listen to clip 07 |
| `(whispering)` mid-sentence | not read aloud; no measurable effect                            | not tested                                          |

- **Inline tags are the only expressive control that works with ultimate clone.**
- **Other models' tags are not VoxCPM2 tags.** Dia's `(laughs)` and CosyVoice's `[laughter]` are different. Use the tags above.
- **Punctuation also steers delivery:** `...` adds a pause, `!` adds energy, `?` gives question intonation. ALL-CAPS words are read normally ("YOU! HANDS UP!" was correct).

---

## 5. Recipe: a good, consistent voice

1. **Design the voice.** Write a three-layer description and generate one 5–15 s sentence that suits the character, with **5 seeds**, e.g. `seed=11, 22, 33, 44, 55`.
2. **Pick the best take.** Listen, or check it with Whisper; keep the take with zero word errors and the right pitch. Then **save it as the voice's reference WAV**.
3. **Save the exact transcript** of that take. It is the text without the `(…)` prefix. If the take differs from the text, transcribe it with ASR (official advice).
4. **Generate every real line with ultimate clone:** `--voice-ref ref.wav --reference-text "<transcript>" --request-option ultimate_clone=true`, with a fixed `seed`.
   - Measured: speaker similarity 0.79–0.86, 0 % word errors on a 39-line story, and the same voice across seeds (0.93).
   - Same seed + same input gives identical audio.
5. **For emotion:**
   - **Best:** design or record a **separate reference per emotion** (e.g. `narrator_sad.wav`) and ultimate-clone from it.
   - **Quick:** audio-only clone with a `(style)` prefix. The voice is a little less similar (0.69 vs 0.79).
   - **Small moments:** inline tags (`[sigh]`, `[Uhm]`) in ultimate-clone lines.
6. **Cross-lingual:** the same reference can speak another language. An English reference speaking Arabic scored 0.7–1.3 % character error rate. For the most natural accent, design a reference in the target language (an Arabic reference scored 0.4 %).

**Reference audio checklist:**

- **Length:** 5–30 s (official); 6–10 s worked well here.
- **Quality:** one speaker, no music or effects, clean.
- **Noise:** this build has no denoise option, so clean noisy clips beforehand.
- **Transcript:** must match **exactly**, including filler words.
- **Loudness:** audio-only clone output came out about 9 dB quieter than other modes. Normalise loudness before mixing.

---

## 6. Text tips

- **Numbers, dates, prices, URLs, emails and phone numbers** were read correctly as written (the hard-text test was perfect).
- **Very short lines** like "Jackpot!" or "Wait... what?" worked (8 of 8 with ultimate clone). Official docs warn that one-word inputs can sound weak, so add a few words if one sounds thin.
- **Long text:** a ~90 s block in one pass scored 0.8 % word error rate. Official docs warn that very long inputs can speed up, buzz or fail to stop; if that happens, split by paragraph and stitch the clips.
- **Arabic with English words:** keep brand names in Latin script (ChatGPT, Godot). Heavy code-switching, e.g. "افتح Unity، ثم أنشئ Scene…", had 7–19 % character error rate: "Scene" was sometimes read as "سين".
- **Phoneme braces** are officially documented for pinning a pronunciation: English CMUdict style `{HH AH0 L OW1}`, Chinese pinyin `{ni3}{hao3}`. Not tested in this build.

---

## 7. Settings (`--request-option key=value`)


| Option                                 | Default             | Advice                                                                                                                                                                                                       |
| -------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `seed`                                 | 1234                | Fix it per character for repeatable output. Try several seeds when designing.                                                                                                                                |
| `num_inference_steps`                  | 10                  | `4` was about 30 % faster with no measurable loss. Official range is 4–30; higher adds detail.                                                                                                              |
| `guidance_scale`                       | 2.0                 | Keep it at**1.5 or higher**: at 1.0 words were dropped. Official range is 1.0–3.0; higher follows the text and prompt more closely but risks artifacts. For long-form buzzing, official advice is 1.5–1.6. |
| `retry_badcase`                        | true                | Keep it on; it retries outputs that are far too long or short for the text.                                                                                                                                  |
| `ultimate_clone`                       | false               | `true` for production cloning. Requires `--voice-ref` and `--reference-text`. **Without it, `--reference-text` is silently ignored.**                                                                        |
| `chunk_strategy` / `text_chunk_size`   | continuation / 2048 | Forcing 400-character chunks made no difference in tests.                                                                                                                                                    |
| `--session-option perf_mode=cuda_perf` | off                 | Slightly faster.                                                                                                                                                                                             |

---

## 8. Gotchas

- **`--reference-text` does nothing without `ultimate_clone=true`.** The output is bit-identical to an audio-only clone.
- **A `(…)` prefix together with `ultimate_clone=true` is read aloud.**
- **The `(…)` must be at the very start** of the text to act as a description or style. Mid-sentence parentheses weren't read aloud but had no measurable effect, so don't rely on them.
- **Design-only voices drift** between seeds and sentences. Clone a saved reference instead.
- **Ethics:** OpenBMB forbids impersonation, fraud and disinformation, and recommends labelling AI-generated audio. Only clone voices you have the right to use.

## Sources

- OpenBMB VoxCPM2 model card: https://huggingface.co/openbmb/VoxCPM2
- Official docs: https://voxcpm.readthedocs.io/en/latest/models/voxcpm2.html
  - Usage guide (cloning modes, reference length, CFG and steps, long text): https://voxcpm.readthedocs.io/en/latest/usage_guide.html
  - "A Voice Chef's Guide to VoxCPM2" (three-layer prompts, non-verbal tags): https://voxcpm.readthedocs.io/en/latest/cookbook.html
- GitHub: https://github.com/OpenBMB/VoxCPM
- audio-cpp option spec: `"$env:USERPROFILE\audio-cpp\bin\model_specs\voxcpm2.json"`
