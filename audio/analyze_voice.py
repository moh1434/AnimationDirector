"""Voice analysis + clean-up for the story pipeline.

  python audio/analyze_voice.py <voice file> <segments.json> <build dir> [fps]

Writes into <build dir>:
  voice.wav       the narration, cleaned with pedalboard (HPF, compression, presence, peak level)
  analysis.json   duration, per-frame mouth openness (lip-sync), voiced intervals, estimated word times

The voice is never time-stretched; everything is measured on the original timing.
"""
import json
import re
import sys
from pathlib import Path

import numpy as np
from pedalboard import Compressor, Gain, HighpassFilter, LowpassFilter, Pedalboard, PeakFilter, LowShelfFilter
from pedalboard.io import AudioFile

SR = 48000


def load_mono(path: str, sr: int) -> np.ndarray:
    with AudioFile(path).resampled_to(sr) as f:
        a = f.read(f.frames)
    a = a.mean(axis=0) if a.ndim == 2 else a
    return a.astype(np.float32)


def frame_rms(x: np.ndarray, sr: int, fps: int) -> np.ndarray:
    hop = sr / fps
    n = int(np.ceil(len(x) / hop))
    win = int(hop * 1.6)
    out = np.zeros(n, dtype=np.float32)
    for i in range(n):
        c = int(i * hop + hop / 2)
        a, b = max(0, c - win // 2), min(len(x), c + win // 2)
        seg = x[a:b]
        out[i] = np.sqrt(np.mean(seg * seg)) if len(seg) else 0.0
    return out


def _sliding(x, w, fn):
    pad = w // 2
    xp = np.pad(x, (pad, pad), mode="edge")
    return fn(np.lib.stride_tricks.sliding_window_view(xp, w), axis=1)


def mouth_curve(rms: np.ndarray) -> np.ndarray:
    """Lip-sync openness per frame: gate on speech, then open relative to the *local* peak so
    syllables open and close even in continuous speech (TTS voices rarely pause)."""
    db = 20 * np.log10(rms + 1e-7)
    floor = np.percentile(db, 10)
    peak = np.percentile(db, 98)
    gate = db > floor + max(6.0, (peak - floor) * 0.22)
    locmax = _sliding(db, 7, np.max)
    rel = np.clip((db - (locmax - 11)) / 11, 0, 1)
    loud = np.clip((db - floor) / max(6.0, peak - floor), 0, 1)
    v = np.where(gate, 0.08 + 0.92 * (rel ** 1.4) * (0.55 + 0.45 * loud), 0.0)
    out = np.zeros_like(v)
    prev = 0.0
    for i, x in enumerate(v):
        k = 0.8 if x > prev else 0.6
        prev = prev + (x - prev) * k
        out[i] = prev
    out[out < 0.06] = 0
    return out


def voiced_intervals(m: np.ndarray, fps: int, thr=0.1, merge=0.16, minlen=0.07):
    on = m > thr
    iv = []
    i = 0
    while i < len(on):
        if on[i]:
            j = i
            while j < len(on) and on[j]:
                j += 1
            iv.append([i / fps, j / fps])
            i = j
        else:
            i += 1
    merged = []
    for a, b in iv:
        if merged and a - merged[-1][1] < merge:
            merged[-1][1] = b
        else:
            merged.append([a, b])
    return [[round(a, 3), round(b, 3)] for a, b in merged if b - a >= minlen]


WORD_RE = re.compile(r"\S+")


def letters(w: str) -> int:
    return len(re.sub(r"[^\w]", "", w, flags=re.UNICODE)) or 1


def snap_to_dips(words, db, fps, radius=0.12):
    """Move estimated word starts onto the nearest energy dip (a likely word boundary)."""
    r = int(radius * fps)
    for i in range(1, len(words)):
        w, p = words[i], words[i - 1]
        if w["seg"] != p["seg"]:
            continue
        c = int(round(w["s"] * fps))
        a, b = max(0, c - r), min(len(db) - 1, c + r)
        if b <= a:
            continue
        k = a + int(np.argmin(db[a:b + 1]))
        t = k / fps
        if p["s"] + 0.06 < t < w["e"] - 0.04:
            w["s"] = round(t, 3)
            p["e"] = round(max(p["s"] + 0.05, min(p["e"], t - 0.01)), 3)
    return words


def distribute_words(segments, voiced):
    """Estimate word times: spread each segment's words over its *voiced* time only, weighted by length."""
    words = []
    for si, seg in enumerate(segments):
        toks = WORD_RE.findall(seg.get("text", ""))
        if not toks:
            continue
        s0, s1 = float(seg["start"]), float(seg["end"])
        parts = []
        for a, b in voiced:
            a2, b2 = max(a, s0), min(b, s1)
            if b2 - a2 > 0.03:
                parts.append([a2, b2])
        if not parts:
            parts = [[s0 + 0.05, s1 - 0.05 if s1 - s0 > 0.2 else s1]]
        total = sum(b - a for a, b in parts)
        weights = [letters(t) + 1.2 + (1.5 if re.search(r"[.!?؟،,:;]$", t) else 0) for t in toks]
        W = sum(weights)

        def at(pos):  # map 0..total voiced seconds to absolute time
            acc = 0.0
            for a, b in parts:
                if pos <= acc + (b - a) + 1e-9:
                    return a + (pos - acc)
                acc += b - a
            return parts[-1][1]

        acc = 0.0
        for t, w in zip(toks, weights):
            st = at(acc / W * total)
            acc += w
            en = at(acc / W * total)
            words.append({"w": t, "s": round(st, 3), "e": round(max(st + 0.06, en - 0.02), 3), "seg": si})
    return words


def main():
    voice, seg_path, build = sys.argv[1], sys.argv[2], Path(sys.argv[3])
    fps = int(sys.argv[4]) if len(sys.argv) > 4 else 30
    build.mkdir(parents=True, exist_ok=True)
    segments = json.loads(Path(seg_path).read_text(encoding="utf-8"))

    x = load_mono(voice, SR)
    duration = len(x) / SR

    # --- clean voice (pedalboard) ---
    board = Pedalboard([
        HighpassFilter(cutoff_frequency_hz=75),
        LowShelfFilter(cutoff_frequency_hz=180, gain_db=-1.5, q=0.7),
        Compressor(threshold_db=-22, ratio=3.0, attack_ms=6, release_ms=90),
        PeakFilter(cutoff_frequency_hz=3600, gain_db=2.5, q=0.8),
        Compressor(threshold_db=-10, ratio=6.0, attack_ms=1, release_ms=60),
    ])
    y = board(x[np.newaxis, :], SR)[0]
    peak = float(np.abs(y).max()) or 1.0
    y = y * (10 ** (-3 / 20) / peak)
    with AudioFile(str(build / "voice.wav"), "w", SR, 1) as f:
        f.write(y[np.newaxis, :].astype(np.float32))

    # --- analysis on a speech-band copy ---
    band = Pedalboard([HighpassFilter(cutoff_frequency_hz=180), LowpassFilter(cutoff_frequency_hz=4200)])(x[np.newaxis, :], SR)[0]
    rms = frame_rms(band, SR, fps)
    m = mouth_curve(rms)
    voiced = voiced_intervals(m, fps, thr=0.05)
    words = snap_to_dips(distribute_words(segments, voiced), 20 * np.log10(rms + 1e-7), fps)

    out = {
        "duration": round(duration, 3),
        "fps": fps,
        "mouth": [int(round(v * 100)) for v in m],
        "voiced": voiced,
        "words": words,
        "word_timing": "estimated",
        "loudness_rms": float(np.sqrt(np.mean(x * x))),
    }
    (build / "analysis.json").write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
    print(json.dumps({"duration": out["duration"], "frames": len(out["mouth"]), "voiced": len(voiced), "words": len(words)}))


if __name__ == "__main__":
    main()
