"""Final mix: voice + ducked music + synthesized sound effects, mastered to a loudness target.

  python audio/mix.py <build dir> [settings json]

Reads build/voice.wav, build/music.wav (optional), build/notes.json (fallback synth),
build/sfx.json (cue list). Writes build/mix.wav plus stems (music_bed.wav, sfx.wav).
settings: {"music_db": -17, "sfx_db": -13, "duck_db": 9, "lufs": -14, "music": true, "sfx": true}
"""
import json
import sys
from pathlib import Path

import numpy as np
from pedalboard import (Compressor, Gain, HighpassFilter, HighShelfFilter, Limiter, LowpassFilter, Pedalboard, Reverb)
from pedalboard.io import AudioFile

SR = 48000
RNG = np.random.default_rng(11)


def load(path, sr=SR, channels=2):
    with AudioFile(str(path)).resampled_to(sr) as f:
        a = f.read(f.frames)
    if a.shape[0] == 1 and channels == 2:
        a = np.vstack([a, a])
    elif a.shape[0] > 2:
        a = a[:2]
    return a.astype(np.float32)


def db(x):
    return 10 ** (x / 20)


# ---------------- sound effects (all synthesized, original) ----------------
def env(n, a=0.002, d=0.1, sr=SR):
    t = np.arange(n) / sr
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / max(d, 1e-4))
    return e.astype(np.float32)


def sweep(f0, f1, dur, kind="sin", sr=SR):
    n = int(dur * sr)
    f = np.geomspace(max(f0, 1), max(f1, 1), n)
    ph = 2 * np.pi * np.cumsum(f) / sr
    if kind == "sin":
        return np.sin(ph).astype(np.float32)
    if kind == "tri":
        return (2 / np.pi * np.arcsin(np.sin(ph))).astype(np.float32)
    return np.sign(np.sin(ph)).astype(np.float32) * 0.5


def noise(n):
    return RNG.standard_normal(n).astype(np.float32)


def filt(x, board):
    return board(x[np.newaxis, :], SR)[0]


def sfx(name, var=0.0):
    p = 1 + var * 0.12
    if name == "pop":
        n = int(0.12 * SR)
        x = sweep(900 * p, 260 * p, 0.12) * env(n, 0.001, 0.035)
        return x * 0.9
    if name == "tick":
        n = int(0.04 * SR)
        return sweep(2400 * p, 1800 * p, 0.04) * env(n, 0.0005, 0.008) * 0.6
    if name == "boop":
        n = int(0.22 * SR)
        return sweep(420 * p, 640 * p, 0.22, "tri") * env(n, 0.005, 0.09) * 0.8
    if name == "ding":
        n = int(1.2 * SR)
        t = np.arange(n) / SR
        f = 1318 * p
        x = (np.sin(2 * np.pi * f * t) + 0.45 * np.sin(2 * np.pi * f * 2.76 * t) + 0.2 * np.sin(2 * np.pi * f * 5.4 * t)) * np.exp(-t * 3.5)
        return x.astype(np.float32) * 0.45
    if name == "sparkle":
        out = np.zeros(int(0.7 * SR), dtype=np.float32)
        for k, f in enumerate([1568, 2093, 2637, 3136]):
            s = int(k * 0.08 * SR)
            n = int(0.35 * SR)
            t = np.arange(n) / SR
            out[s:s + n] += (np.sin(2 * np.pi * f * p * t) * np.exp(-t * 12)).astype(np.float32) * 0.3
        return out
    if name in ("whoosh", "swoosh", "swish", "iris"):
        dur = {"whoosh": 0.42, "swoosh": 0.3, "swish": 0.2, "iris": 0.5}[name]
        n = int(dur * SR)
        t = np.linspace(0, 1, n, dtype=np.float32)
        shape = np.sin(np.pi * t) ** 2
        x = noise(n) * shape
        lo, hi = (500, 3500) if name != "swish" else (1500, 6000)
        x = filt(x, Pedalboard([HighpassFilter(lo * p), LowpassFilter(hi * p)]))
        return x * (0.9 if name == "whoosh" else 0.7)
    if name == "boing":
        n = int(0.45 * SR)
        t = np.arange(n) / SR
        f = 180 * p * (1 + 0.6 * np.sin(2 * np.pi * 14 * t) * np.exp(-t * 6))
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 5)
        return x.astype(np.float32) * 0.8
    if name == "hit":
        n = int(0.3 * SR)
        body = sweep(160 * p, 50, 0.3) * env(n, 0.001, 0.08)
        snap = filt(noise(n) * env(n, 0.0005, 0.03), Pedalboard([HighpassFilter(1200)]))
        return (body * 0.9 + snap * 0.5)
    if name == "thud":
        n = int(0.5 * SR)
        return sweep(110 * p, 38, 0.5) * env(n, 0.002, 0.16) * 1.0
    return np.zeros(10, dtype=np.float32)


# ---------------- fallback synth if Tone.js is unavailable ----------------
def synth_notes(notes_path, total):
    data = json.loads(Path(notes_path).read_text(encoding="utf-8"))
    out = np.zeros(int(total * SR), dtype=np.float32)
    for tr in data["tracks"]:
        role = tr["role"]
        for t, d, p, v in tr["notes"]:
            s = int(t * SR)
            if s >= len(out):
                continue
            if tr["drum"]:
                n = int(0.15 * SR)
                x = (sweep(120, 45, 0.15) if role in ("kick", "tom") else noise(n) * 0.3) * env(n, 0.001, 0.05)
            else:
                f = 440 * 2 ** ((p - 69) / 12)
                n = int((d + 0.3) * SR)
                tt = np.arange(n) / SR
                dec = 0.25 if role in ("pluck", "marimba") else 1.2
                x = (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(4 * np.pi * f * tt)) * np.exp(-tt / dec)
                if role == "pad":
                    x = np.sin(2 * np.pi * f * tt) * np.minimum(1, tt / 0.5) * 0.4
            x = x.astype(np.float32) * (v / 127) * 0.2
            e = min(len(out), s + len(x))
            out[s:e] += x[: e - s]
    out = filt(out, Pedalboard([Reverb(room_size=0.5, wet_level=0.2)]))
    return np.vstack([out, out])


# ---------------- loudness (BS.1770-style, K-weighting approximated with pedalboard filters) ----------------
def lufs(x):
    k = Pedalboard([HighpassFilter(38), HighShelfFilter(cutoff_frequency_hz=1500, gain_db=4.0, q=0.707)])(x, SR)
    blk, hop = int(0.4 * SR), int(0.1 * SR)
    if k.shape[1] < blk:
        return -70.0
    ms = []
    for s in range(0, k.shape[1] - blk, hop):
        ms.append(np.mean(k[:, s:s + blk] ** 2, axis=1).sum())
    ms = np.array(ms)
    L = -0.691 + 10 * np.log10(ms + 1e-12)
    ms = ms[L > -70]
    if not len(ms):
        return -70.0
    rel = -0.691 + 10 * np.log10(ms.mean()) - 10
    L2 = -0.691 + 10 * np.log10(ms + 1e-12)
    g = ms[L2 > rel]
    return float(-0.691 + 10 * np.log10(g.mean() + 1e-12))


def limit(x, ceiling_db=-1.0, look=0.004, release=0.09):
    """Look-ahead peak limiter (numpy). Keeps peaks under the ceiling without changing loudness elsewhere."""
    c = db(ceiling_db)
    peak = np.abs(x).max(axis=0)
    blk = max(1, int(look * SR))
    n = int(np.ceil(len(peak) / blk))
    bp = np.pad(peak, (0, n * blk - len(peak))).reshape(n, blk).max(axis=1)
    g = np.minimum(1.0, c / np.maximum(bp, 1e-9))
    g = np.minimum(g, np.concatenate([g[1:], [1.0]]))
    rel = float(np.exp(-blk / SR / release))
    out = g.copy()
    for i in range(1, n):
        out[i] = min(g[i], out[i - 1] * rel + (1 - rel) * 1.0)
    gs = np.interp(np.arange(len(peak)), np.arange(n) * blk, out).astype(np.float32)
    return np.clip(x * gs, -c, c)


def voice_envelope(v, sr=SR):
    """0..1 'voice is talking' curve for sidechain ducking (attack 25 ms, release 350 ms)."""
    hop = int(0.01 * sr)
    m = np.abs(v).reshape(-1)[: (len(v) // hop) * hop].reshape(-1, hop).max(axis=1)
    thr = max(1e-4, np.percentile(m, 95) * 0.08)
    on = (m > thr).astype(np.float32)
    out = np.zeros_like(on)
    prev = 0.0
    for i, x in enumerate(on):
        k = 0.35 if x > prev else 0.028
        prev += (x - prev) * k
        out[i] = prev
    return np.repeat(out, hop)


def main():
    build = Path(sys.argv[1])
    cfg = {"music_db": -12.0, "sfx_db": -14.0, "duck_db": 8.0, "lufs": -14.0, "music": True, "sfx": True}
    if len(sys.argv) > 2:
        cfg.update(json.loads(sys.argv[2]))
    voice = load(build / "voice.wav", channels=1)[0]
    analysis = json.loads((build / "analysis.json").read_text(encoding="utf-8"))
    total = max(len(voice) / SR, analysis.get("duration", 0)) + 0.6
    N = int(total * SR)
    v = np.zeros(N, dtype=np.float32)
    v[: len(voice)] = voice
    vrms = np.sqrt(np.mean(voice[np.abs(voice) > 0.01] ** 2)) if np.any(np.abs(voice) > 0.01) else 0.1

    # music bed
    music = np.zeros((2, N), dtype=np.float32)
    if cfg["music"]:
        mp = build / "music.wav"
        if mp.exists():
            m = load(mp)
        elif (build / "notes.json").exists():
            m = synth_notes(build / "notes.json", total)
            print("music: Tone.js render not found, used the plain fallback synth")
        else:
            m = np.zeros((2, N), dtype=np.float32)
        L = min(N, m.shape[1])
        music[:, :L] = m[:, :L]
        music = Pedalboard([HighpassFilter(45), Compressor(threshold_db=-20, ratio=2.5)])(music, SR)
        mrms = np.sqrt(np.mean(music ** 2)) + 1e-9
        music *= vrms / mrms * db(cfg["music_db"] + 6)  # music sits below the voice
        duck = voice_envelope(v)[:N]
        duck = np.pad(duck, (0, max(0, N - len(duck))))
        gain = db(-cfg["duck_db"] * duck)
        music *= gain[np.newaxis, :]
        fade_in, fade_out = int(0.4 * SR), int(min(2.0, total * 0.15) * SR)
        music[:, :fade_in] *= np.linspace(0, 1, fade_in)
        music[:, -fade_out:] *= np.linspace(1, 0, fade_out)

    # sound effects
    fx = np.zeros((2, N), dtype=np.float32)
    cues = json.loads((build / "sfx.json").read_text(encoding="utf-8")) if (build / "sfx.json").exists() else []
    if cfg["sfx"]:
        for i, c in enumerate(cues):
            x = sfx(c["name"], var=float(RNG.uniform(-1, 1)))
            s = int(c["t"] * SR)
            if s < 0 or s >= N:
                continue
            e = min(N, s + len(x))
            pan = float(RNG.uniform(-0.25, 0.25))
            g = c.get("gain", 1.0)
            fx[0, s:e] += x[: e - s] * g * (1 - pan)
            fx[1, s:e] += x[: e - s] * g * (1 + pan)
        fx = Pedalboard([HighpassFilter(90), Reverb(room_size=0.25, wet_level=0.08, dry_level=1.0)])(fx, SR)
        fx *= vrms * db(cfg["sfx_db"] + 12)

    vv = np.vstack([v, v])
    mix = vv + music + fx
    mix = Pedalboard([Compressor(threshold_db=-16, ratio=2.0, attack_ms=10, release_ms=120)])(mix, SR)
    L = lufs(mix)
    mix *= db(cfg["lufs"] - L)
    mix = limit(mix, -1.0)
    L2 = lufs(mix)
    if L2 < cfg["lufs"] - 0.6:  # limiting ate some loudness: one more gentle pass
        mix = limit(mix * db(min(3.0, cfg["lufs"] - L2)), -1.0)
    with AudioFile(str(build / "mix.wav"), "w", SR, 2, bit_depth=16) as f:
        f.write(np.clip(mix, -1, 1))
    for nm, arr in (("music_bed.wav", music), ("sfx.wav", fx)):
        with AudioFile(str(build / nm), "w", SR, 2, bit_depth=16) as f:
            f.write(np.clip(arr, -1, 1))
    report = {"lufs_before": round(float(L), 2), "lufs_target": cfg["lufs"], "lufs_after": round(float(lufs(mix)), 2), "peak_dbfs": round(float(20 * np.log10(np.abs(mix).max() + 1e-9)), 2), "sfx_cues": len(cues), "duration": round(total, 2)}
    (build / "audio_report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report))


if __name__ == "__main__":
    main()
