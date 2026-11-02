"""Original background score with pretty_midi.

  python audio/compose_music.py <build dir> <duration s> <mood> [seed] [cut times json]

Writes score.mid (open it in any DAW) and notes.json (rendered to audio by Tone.js in
pipeline/tone-render.mjs; audio/mix.py has a plain numpy fallback synth).
Moods: playful, curious, epic, space, upbeat, calm
"""
import json
import random
import sys
from pathlib import Path

import pretty_midi

MOODS = {
    # key root (MIDI), scale, bpm, progression (scale degrees, 0-based), texture
    "playful": dict(root=60, scale=[0, 2, 4, 5, 7, 9, 11], bpm=112, prog=[0, 5, 3, 4], lead="marimba", chords="pluck", drums="light", pad=False),
    "curious": dict(root=62, scale=[0, 2, 3, 5, 7, 9, 10], bpm=100, prog=[0, 3, 0, 6], lead="pluck", chords="marimba", drums="shaker", pad=True),
    "epic": dict(root=57, scale=[0, 2, 3, 5, 7, 8, 10], bpm=88, prog=[0, 5, 2, 6], lead="bell", chords="pad", drums="toms", pad=True),
    "space": dict(root=57, scale=[0, 2, 3, 5, 7, 8, 10], bpm=78, prog=[0, 5, 3, 4], lead="bell", chords="pad", drums="none", pad=True),
    "upbeat": dict(root=64, scale=[0, 2, 4, 5, 7, 9, 11], bpm=120, prog=[0, 4, 5, 3], lead="pluck", chords="marimba", drums="full", pad=False),
    "calm": dict(root=65, scale=[0, 2, 4, 5, 7, 9, 11], bpm=76, prog=[5, 3, 0, 4], lead="piano", chords="pad", drums="none", pad=True),
}

GM = {"pluck": 45, "marimba": 12, "bell": 14, "pad": 89, "bass": 33, "piano": 0}


def chord(root, scale, degree, octave=0, size=3):
    out = []
    for k in range(size):
        d = degree + 2 * k
        out.append(root + 12 * octave + scale[d % 7] + 12 * (d // 7))
    return out


def compose(duration, mood, seed=7, cuts=None):
    m = MOODS.get(mood, MOODS["playful"])
    rnd = random.Random(seed)
    bpm = m["bpm"]
    beat = 60.0 / bpm
    bar = beat * 4
    n_bars = int(duration / bar) + 2
    pm = pretty_midi.PrettyMIDI(initial_tempo=bpm)
    inst = {}

    def I(role, drum=False):
        if role not in inst:
            i = pretty_midi.Instrument(program=GM.get(role, 0), is_drum=drum, name=role)
            inst[role] = i
            pm.instruments.append(i)
        return inst[role]

    def note(role, pitch, start, dur, vel, drum=False):
        if start >= duration + 2.5:
            return
        I(role, drum).notes.append(pretty_midi.Note(velocity=int(max(1, min(127, vel))), pitch=int(pitch), start=start, end=start + dur))

    root, scale, prog = m["root"], m["scale"], m["prog"]
    # a 2-bar motif reused with variations
    motif = [rnd.choice([0, 2, 4, 2, 4, 5, 7]) for _ in range(8)]
    rhythm = rnd.choice([[0, 1, 1.5, 2, 3, 3.5], [0, 0.5, 1.5, 2, 2.5, 3.5], [0, 1, 2, 2.5, 3]])
    arp_pat = rnd.choice([[0, 1, 2, 1], [0, 2, 1, 2], [0, 1, 2, 3]])
    cut_bars = set(int(c / bar) for c in (cuts or []))

    for b in range(n_bars):
        t0 = b * bar
        deg = prog[b % len(prog)]
        section = (b // 8) % 3  # A / B / A' variation
        intro = b < 2
        outro = t0 > duration - bar * 1.5
        ch = chord(root, scale, deg, 0, 4)
        # bass
        if not intro or mood in ("epic", "space"):
            bpat = [0, 2] if mood in ("space", "calm", "epic") else [0, 1.5, 2, 3]
            for k, bt in enumerate(bpat):
                p = ch[0] - 24 + (7 if (k == 2 and mood not in ("space", "calm")) else 0)
                note("bass", p, t0 + bt * beat, beat * (1.8 if len(bpat) == 2 else 0.8), 82 if k == 0 else 70)
        # chords / pad
        if m["pad"] or m["chords"] == "pad":
            for p in ch[:3]:
                note("pad", p, t0, bar * 0.98, 54)
        if m["chords"] in ("pluck", "marimba") and not intro:
            for k in range(8):
                p = ch[arp_pat[k % 4] % 4] + (12 if section == 1 and k % 2 else 0)
                note(m["chords"], p, t0 + k * beat / 2, beat * 0.45, 62 if k % 2 else 74)
        elif m["chords"] == "pad" and mood == "space":
            for k in range(8):
                p = ch[[0, 1, 2, 3, 2, 1, 2, 3][k] % 4] + 12
                note("bell", p, t0 + k * beat / 2, beat * 1.5, 40 + (k % 2) * 10)
        # lead melody (not every bar, leaves room for the voice)
        if not intro and not outro and (b % 4 in (1, 2)) and section != 2:
            for k, rt in enumerate(rhythm):
                d = motif[(k + b) % len(motif)] + deg
                p = root + 12 + scale[d % 7] + 12 * (d // 7)
                note(m["lead"], p, t0 + rt * beat, beat * 0.42, 66 + rnd.randint(-6, 6))
        # drums
        dr = m["drums"]
        if dr != "none" and not intro and not outro:
            for k in range(4):
                tb = t0 + k * beat
                if dr in ("light", "full"):
                    if k in (0, 2):
                        note("kick", 36, tb, 0.1, 90 if k == 0 else 70, True)
                    if k in (1, 3):
                        note("snare", 39 if dr == "light" else 38, tb, 0.1, 70, True)
                    note("hat", 42, tb + beat / 2, 0.05, 48, True)
                    if dr == "full":
                        note("hat", 42, tb, 0.05, 40, True)
                elif dr == "shaker":
                    note("shaker", 70, tb, 0.05, 50, True)
                    note("shaker", 70, tb + beat / 2, 0.05, 34, True)
                    if k == 0:
                        note("kick", 36, tb, 0.1, 64, True)
                elif dr == "toms":
                    if k == 0 or (k == 2 and b % 2):
                        note("tom", 45, tb, 0.2, 84, True)
                    if k == 3 and b % 4 == 3:
                        note("tom", 43, tb + beat / 2, 0.2, 70, True)
        if b in cut_bars and b > 1 and dr != "none":
            note("crash", 49, t0, 0.5, 40, True)
    # final chord on the end
    end_t = max(0.5, duration - 0.3)
    for p in chord(root, scale, 0, 0, 3):
        note("pad" if m["pad"] else m["chords"], p, end_t, 2.5, 60)
    note("bass", root - 24, end_t, 2.5, 70)
    return pm, bpm


def main():
    build = Path(sys.argv[1])
    duration = float(sys.argv[2])
    mood = sys.argv[3] if len(sys.argv) > 3 else "playful"
    seed = int(sys.argv[4]) if len(sys.argv) > 4 else 7
    cuts = json.loads(sys.argv[5]) if len(sys.argv) > 5 else []
    pm, bpm = compose(duration, mood, seed, cuts)
    build.mkdir(parents=True, exist_ok=True)
    pm.write(str(build / "score.mid"))
    data = {"bpm": bpm, "mood": mood, "duration": duration, "tracks": []}
    for i in pm.instruments:
        data["tracks"].append({"role": i.name, "drum": i.is_drum, "notes": [[round(n.start, 4), round(n.end - n.start, 4), n.pitch, n.velocity] for n in i.notes]})
    (build / "notes.json").write_text(json.dumps(data), encoding="utf-8")
    print(json.dumps({"mood": mood, "bpm": bpm, "tracks": [t["role"] for t in data["tracks"]], "notes": sum(len(t["notes"]) for t in data["tracks"])}))


if __name__ == "__main__":
    main()
