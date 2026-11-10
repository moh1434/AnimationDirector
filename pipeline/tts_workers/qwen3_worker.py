"""One take with Qwen3-TTS 1.7B (English only). See TTS.md.

Run inside the model's own environment:
    uv run --no-sync --project <TTS_QWEN3_DIR> python -I qwen3_worker.py <job.json>

Two modes, two sets of weights in the model folder:
  design  weights/       (VoiceDesign) a new voice from an English "description"
  clone   weights-base/  (Base) zero-shot clone of "reference" + its exact "referenceText"
job.json: {"modelDir", "mode", "description" | "reference"+"referenceText", "chunks": [text, ...],
           "pause", "seed", "options": {"temperature", "top_p", "top_k", "max_new_tokens"}, "cooldown", "out"}
A designed voice changes person between generations, so a design take is ONE chunk (the caller
sends all of a character's lines at once). Clone takes may be several chunks joined with `pause` s.
"""
import json, sys, time, pathlib
import numpy as np
import torch, soundfile as sf
from qwen_tts import Qwen3TTSModel

job = json.loads(pathlib.Path(sys.argv[1]).read_text(encoding="utf-8"))
root = pathlib.Path(job["modelDir"])
mode = job["mode"]
weights = root / ("weights" if mode == "design" else "weights-base")
if not (weights / "config.json").exists():
    sys.exit(f"No Qwen3-TTS weights in {weights}")
opts = {k: v for k, v in (job.get("options") or {}).items() if k in ("temperature", "top_p", "top_k", "max_new_tokens", "repetition_penalty")}
opts.setdefault("max_new_tokens", 4096)
seed = int(job.get("seed", 1234))

model = Qwen3TTSModel.from_pretrained(str(weights), device_map="cuda:0", dtype=torch.bfloat16, attn_implementation="sdpa")
prompt = model.create_voice_clone_prompt(ref_audio=job["reference"], ref_text=job["referenceText"]) if mode == "clone" else None

pieces, sr = [], None
for i, text in enumerate(job["chunks"]):
    if i:
        time.sleep(float(job.get("cooldown", 15)))
    t = time.time()
    torch.manual_seed(seed + i)
    if mode == "design":
        wavs, sr = model.generate_voice_design(text=text, language="English", instruct=job["description"], **opts)
    else:
        wavs, sr = model.generate_voice_clone(text=text, language="English", voice_clone_prompt=prompt, **opts)
    audio = np.asarray(wavs[0], dtype=np.float32)
    if pieces:
        pieces.append(np.zeros(int(sr * float(job.get("pause", 0.35))), dtype=np.float32))
    pieces.append(audio)
    print(f"chunk {i + 1}/{len(job['chunks'])}: {len(audio) / sr:.1f}s audio in {time.time() - t:.1f}s", flush=True)
    torch.cuda.empty_cache()

sf.write(job["out"], np.concatenate(pieces), sr)
