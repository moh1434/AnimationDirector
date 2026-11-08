# CosyVoice3 voice guide (audio-cpp, `cosyvoice3-q8_0.gguf`)

How to clone voices well, control style with instructions, use inline tags, and avoid CosyVoice3's pitfalls in this audio-cpp build.

The model is Fun-CosyVoice3-0.5B (FunAudioLLM / Alibaba), 24 kHz output.

This guide combines two sources:
- **Official FunAudioLLM sources:** the GitHub repo, the model card, and the code (`example.py`, `tokenizer.py`, `common.py`).
- **Local measurements** on this build: `C:\Users\lenovo\Desktop\Ai Influencer\TTS_comparison` (180 clips) and a 2026-11-08 test of instructions and tags (`CosyVoice3-GGUF\_style_probe\`).

---

## 0. What CosyVoice3 is good and bad at here

| ✅ Strengths | ❌ Weaknesses |
|---|---|
| **Best cloning of the 3 models tested:** speaker similarity 0.83 with zero-shot, up to 0.92 | **Always needs a reference WAV.** It has no voice design from a text description. |
| **Most consistent:** 0.95 across seeds, 0.84 across different sentences | **No Arabic.** Supports 9 languages: zh, en, ja, ko, de, es, fr, it, ru, plus 18+ Chinese dialects. Arabic came out as gibberish (82–97 % character error rate). |
| **Fastest:** about 4× faster than real time on an RTX 4070 laptop GPU | **ALL-CAPS words are spelled letter by letter** ("YOU!" became "Y-O-U") |
| Robust to every setting tried | 24 kHz output, slightly less "airy" than 44–48 kHz models |
| Instruct mode gives **strong** control, but only with the official instruction list (section 3) | Free-form instructions and long voice descriptions barely change anything |

---

## 1. The three templates

```powershell
C:\Users\lenovo\audio-cpp\bin\audiocpp_cli.exe --task clon --family cosyvoice3 `
  --model C:\Users\lenovo\audio-cpp\models\CosyVoice3-GGUF\cosyvoice3-q8_0.gguf --backend cuda `
  --voice-ref ref.wav --reference-text "<exact transcript of ref.wav>" `
  --request-option template_name=zero_shot --request-option seed=42 `
  --text "Text to speak." --out out.wav
```

| Template | Pass | Use it for | Measured |
|---|---|---|---|
| `zero_shot` (default) | `--voice-ref` + `--reference-text` | **Best quality cloning.** Use it by default. | Similarity 0.83 (up to 0.92), 0 % word errors on most texts |
| `cross_lingual` | `--voice-ref` only, no transcript | You have no transcript, or the reference is in another language than the text | Similarity 0.77 |
| `instruct` | `--voice-ref` + `--reference-text` + `--request-option "instruct=<instruction>"`, with **`--task tts`** | Changing emotion, speed, volume or dialect while keeping the reference timbre | See section 3 |

- **Task flag:** zero-shot and cross-lingual run with `--task clon`, instruct with `--task tts`, as in the comparison harness.
- **Wrapper:** pass **only the instruction text**. Don't add `You are a helpful assistant.` or `<|endofprompt|>`. The official Python API needs that wrapper, and audio-cpp adds it itself: the template strings are in the binary, and plain instructions worked in every test.

---

## 2. Getting a good voice (cloning recipe)

CosyVoice3 can't invent a voice from a description. **The voice is 100 % the reference audio**, so the reference is everything.

1. **Get a good reference.**
   - **Length:** 5–15 s. All references in the tests were 6–10 s.
   - **Quality:** one speaker, clean, no music or reverb.
   - **Content:** natural speech in the **tone you want**. An energetic clip gives energetic output.
   - **Sources:** your own recording, or a voice designed with VoxCPM2 (see `..\VoxCPM2-GGUF\README.md`, section 5). CosyVoice3 cloned VoxCPM2-designed voices *more closely than VoxCPM2 itself did*.
2. **Write the exact transcript** of the reference, including filler words, and use `zero_shot`. A wrong transcript hurts quality; the transcript raised similarity from 0.77 to 0.83.
3. **Fix the `seed`** per character. The default is 1986. Same seed + same input gives identical audio.
4. **For different emotions:**
   - **Best:** a separate reference recorded or designed in that emotion.
   - **Quick:** `instruct` with an official instruction (section 3).

---

## 3. Instruct mode: style, emotion, speed, volume, dialect

CosyVoice3 was **trained on a fixed set of instructions** (`instruct_list` in the official `cosyvoice/utils/common.py`). Use them **exactly as written**, including the Chinese ones; they work for English text too.

| Effect | Instruction (copy exactly) | Measured on English text (plain clone: 4.8 s, -27 dB, 174 Hz) |
|---|---|---|
| Loud | `Please say a sentence as loudly as possible.` | **-20.7 dB (+6.6 dB)**, pitch 286 Hz |
| Soft | `Please say a sentence in a very soft voice.` | **-37.6 dB (-10 dB)**, pitch 114 Hz |
| Fast | `请用尽可能快地语速说一句话。` ("as fast as possible") | **3.4 s (29 % shorter)** |
| Slow | `请用尽可能慢地语速说一句话。` ("as slowly as possible") | **7.3 s (50 % longer)** |
| Happy | `请非常开心地说一句话。` ("very happily") | brighter, pitch 219 Hz, 6.2 s |
| Sad | `请非常伤心地说一句话。` ("very sadly") | quieter (-32 dB), lower (151 Hz), slower |
| Angry | `请非常生气地说一句话。` ("very angrily") | louder (-25 dB), much higher (262 Hz) |
| Cartoon / robot | `我想体验一下小猪佩奇风格，可以吗？` (Peppa Pig style), `你可以尝试用机器人的方式解答吗？` (robot) | not tested |
| Chinese dialect | `请用广东话表达。` (Cantonese). Also 东北, 甘肃, 贵州, 河南, 湖北, 湖南, 江西, 闽南, 宁夏, 山西, 陕西, 山东, 上海, 四川, 天津, 云南 + `话表达。` | not tested, Chinese text only |

**Free-form instructions are weak:**
- "Please speak in a very happy, excited tone." changed almost nothing (4.8 s, 190 Hz).
- In test 14, the full 710-character `voiceDescription` as instruct kept each reference's own voice (similarity 0.85–0.87) and only slowed the delivery.
- "Please speak like an energetic, upbeat YouTuber." and the test-06 emotion sentences changed pace only moderately.
- **Instruct changes delivery, never identity:** the timbre always comes from the reference.

All instruct clips stayed word-perfect (0 % word errors). Instructions are never read aloud.

---

## 4. Inline tags inside the text

These are official fine-grained control tokens from the tokenizer (`tokenizer.py`); they work in all templates.

| Tag | Effect | Measured (zero-shot, English) |
|---|---|---|
| `[laughter]` | a laugh at that point | ✅ not read aloud; adds 2.0 s, most likely the laugh (listen to clip 04) |
| `<laughter>words</laughter>` | the words spoken while laughing | ✅ words intact; adds 0.8 s (clip 06) |
| `<strong>word</strong>` | emphasis on the word | ✅ not read aloud; adds 1.0 s around the stressed word (clip 05) |
| `[breath]` | a breath | ✅ not read aloud; +1.0 s in `cross_lingual`, no change in `zero_shot`. The official example uses cross-lingual. |
| `[noise]` `[cough]` `[clucking]` `[accent]` `[quick_breath]` `[hissing]` `[sigh]` `[vocalized-noise]` `[lipsmack]` `[mn]` | other non-verbal sounds (from the tokenizer list) | not tested |

- **Use tags sparingly**, one or two per sentence.
- **Other models' tags don't work here.** Dia's `(laughs)` and VoxCPM2's `[laughing]` are different tokens; a word in parentheses may be read aloud.
- **Punctuation shapes delivery:** `...` adds a pause, `!` adds energy, `?` gives question intonation.

---

## 5. Text rules (important)

- **Never send ALL-CAPS words.** Single capitalised words are spelled out: "YOU! HANDS UP!" was read as "Y-O-U, hands up!" and "I DID IT! I'M FREE!" failed too. Convert to sentence case ("You! Hands up!" was read correctly) and use `!` or `<strong>` for emphasis. Keep real acronyms like NASA and FBI as they are.
- **One-word lines are risky.** "Jackpot!" produced an **empty clip**, and "bark" became "barf". Add a few words or merge short lines with the next one.
- **URLs and emails got garbled.** Write them as spoken words, e.g. "my game dot dev".
- **Numbers, prices and dates** were mostly fine. CosyVoice3 normalises text itself.
- **Japanese must be written in katakana** (official note in `example.py`).
- **Long text** is split automatically at 600 characters (`text_chunk_size`). A 90 s block came out at 5–6 % word error rate, so for best quality generate paragraph by paragraph and stitch.
- **Pronunciation fix:** officially supported with Chinese pinyin per character, e.g. `[j][ǐ]`, and English CMU phonemes (the tokenizer contains tokens like `[AA1]`). Not tested in this build.
- **No Arabic.** Use VoxCPM2 for Arabic.

---

## 6. Settings (`--request-option key=value`)

| Option | Default | Advice |
|---|---|---|
| `template_name` | `zero_shot` | Section 1 |
| `seed` | 1986 | Fix it per character |
| `num_inference_steps` | 10 | `4` is the fastest with no measurable loss. Tested 4–25, all fine. |
| `top_k` | 25 | Tested 1–100, all fine. Keep the default. |
| `text_chunk_size` | 600 | 300 made no real difference |
| `instruct` | — | Only with `template_name=instruct`. Use an official instruction. |

---

## 7. Quick recipes

```powershell
# best clone
... --task clon --voice-ref narrator.wav --reference-text "Every great story starts with a single moment." `
    --request-option template_name=zero_shot --text "Meet Bob. Bob is a professional thief."

# same voice, whispering softly
... --task tts --voice-ref narrator.wav --reference-text "Every great story starts with a single moment." `
    --request-option template_name=instruct --request-option "instruct=Please say a sentence in a very soft voice." `
    --text "He slowly opens the cupboard door..."

# same voice, inline laugh + emphasis
... --task clon --voice-ref host.wav --reference-text "<transcript>" --request-option template_name=zero_shot `
    --text "Then you just ask it to fix it. [laughter] That's the <strong>fun</strong> part."
```

## Sources

- FunAudioLLM CosyVoice repo: https://github.com/FunAudioLLM/CosyVoice
  - Usage examples: `example.py`, function `cosyvoice3_example`
  - Official instruction list: `cosyvoice/utils/common.py` (`instruct_list`)
  - Inline control tokens: `cosyvoice/tokenizer/tokenizer.py`
- Model card: https://huggingface.co/FunAudioLLM/Fun-CosyVoice3-0.5B-2512
- Demo: https://funaudiollm.github.io/cosyvoice3/
- audio-cpp option spec: `C:\Users\lenovo\audio-cpp\bin\model_specs\cosyvoice3.json`
- Local measurements:
  - `C:\Users\lenovo\Desktop\Ai Influencer\TTS_comparison\REPORT.md`
  - Probe script: `_harness\probe_cosy.py`
  - Probe results: `CosyVoice3-GGUF\_style_probe\probe_results.json`
