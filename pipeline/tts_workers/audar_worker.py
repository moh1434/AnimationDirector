"""One take with Audar-TTS-V1-Turbo (zero-shot clone, English and Arabic). See TTS.md.

Run inside the model's own environment (its folder holds .venv and weights/):
    uv run --no-sync --project <TTS_AUDAR_DIR> python -I audar_worker.py <job.json>

job.json: {"modelDir", "reference", "referenceText", "chunks": [text, ...], "pause", "seed",
           "options": {"temperature", "top_k", "top_p", "repeat_penalty"}, "cooldown", "out"}
The chunks are generated one after another (one model, a rest between them: MODEL_SAFETY.md) and
joined with `pause` seconds of silence into one WAV at 24 kHz.
"""
import json, re, sys, time, pathlib
import numpy as np
import torch, soundfile as sf, librosa
from huggingface_hub import hf_hub_download
from llama_cpp import Llama
from neucodec import NeuCodec

SR = 24_000
MAX_CODES = 1800  # 50 codes a second: 36 s, the most one chunk may become

job = json.loads(pathlib.Path(sys.argv[1]).read_text(encoding="utf-8"))
root = pathlib.Path(job["modelDir"])
ggufs = sorted((root / "weights").glob("*.gguf"))
if not ggufs:
    sys.exit(f"No .gguf model in {root / 'weights'}")
opts = {"temperature": 0.8, "top_k": 40, "top_p": 0.9, "repeat_penalty": 1.1, **(job.get("options") or {})}
seed = int(job.get("seed", 1234))

llm = Llama(model_path=str(ggufs[0]), n_ctx=8192, n_gpu_layers=int(opts.get("gpu_layers", 0)), verbose=False, seed=seed)

codec = NeuCodec(24_000, 480)
try:
    ckpt = hf_hub_download("eugenehp/neucodec", "pytorch_model.bin", local_files_only=True)
except Exception:
    ckpt = hf_hub_download("eugenehp/neucodec", "pytorch_model.bin")
sd = torch.load(ckpt, map_location="cpu")
sd = {k: v for k, v in sd.items() if not any(s in k for s in ("fc_post_s", "SemanticDecoder"))}
codec.load_state_dict(sd, strict=False)
device = "cuda" if torch.cuda.is_available() else "cpu"
codec = codec.eval().to(device)

wav, _ = librosa.load(job["reference"], sr=16000, mono=True)
wav = wav[: 16000 * 15]
with torch.no_grad():
    ref_codes = codec.encode_code(torch.from_numpy(wav)[None, None, :].to(device)).squeeze().tolist()
ref = "".join(f"<|speech_{c}|>" for c in ref_codes)
tce = llm.tokenize(b"<|TARGET_CODES_END|>", add_bos=False, special=True)[0]

pieces, gap = [], np.zeros(int(SR * float(job.get("pause", 0.35))), dtype=np.float32)
for i, text in enumerate(job["chunks"]):
    if i:
        time.sleep(float(job.get("cooldown", 15)))
    t = time.time()
    prompt = ("user: Convert the text to speech:"
              f"<|REF_TEXT_START|>{job['referenceText']}<|REF_TEXT_END|>"
              f"<|REF_SPEECH_START|>{ref}<|REF_SPEECH_END|>"
              f"<|TARGET_TEXT_START|>{text}<|TARGET_TEXT_END|>"
              "\nassistant:<|TARGET_CODES_START|>")
    toks = llm.tokenize(prompt.encode("utf-8"), add_bos=False, special=True)
    llm.reset()
    llm.set_seed(seed + i)
    gen, ended = [], False
    for tid in llm.generate(toks, temp=float(opts["temperature"]), top_k=int(opts["top_k"]), top_p=float(opts["top_p"]), repeat_penalty=float(opts["repeat_penalty"])):
        if tid == tce:
            ended = True
            break
        if len(gen) >= MAX_CODES:
            break
        gen.append(tid)
    out = "".join(llm.detokenize([x], special=True).decode("utf-8", "ignore") for x in gen)
    codes = [int(x) for x in re.findall(r"<\|speech_(\d+)\|>", out)]
    if not codes:
        sys.exit(f"chunk {i + 1}: the model made no speech")
    with torch.no_grad():
        audio = codec.decode_code(torch.tensor(codes)[None, None, :].to(device)).cpu().numpy()[0, 0, :].astype(np.float32)
    if not ended:
        print(f"warning: chunk {i + 1} reached the length limit and may be cut off", file=sys.stderr, flush=True)
    pieces += ([gap] if pieces else []) + [audio]
    print(f"chunk {i + 1}/{len(job['chunks'])}: {len(audio) / SR:.1f}s audio in {time.time() - t:.1f}s", flush=True)
    if device == "cuda":
        torch.cuda.empty_cache()

sf.write(job["out"], np.concatenate(pieces), SR)
