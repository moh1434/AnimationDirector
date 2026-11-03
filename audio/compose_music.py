"""Original background score with pretty_midi, scored to the picture.

  python audio/compose_music.py <build dir> <duration s> <mood> [seed] [spotting.json | cut times json]

Picture scoring (see .claude/skills/music-scoring):
  * tempo map   — the tempo (within ±8 % of the mood's) and the downbeat phase are chosen so that the
                  important cuts land on beats, and the big ones on a bar line;
  * spotting    — each structural moment gets one treatment: direct hit (accent on the beat),
                  anticipation (the band drops out a beat before, a fill leads in), aftermath
                  (a held chord after), or no hit (most cuts: the music just carries on);
  * harmony     — melody notes on strong beats are chord tones; weak beats may pass through the scale;
  * speech gaps — the lead melody only plays where the voice is silent (intro, pauses, outro);
  * intensity   — a curve from the scenes' energy drives drum density, register and velocity, with a
                  lift towards the end and a final chord that lands on a beat after the last word.

Writes score.mid (open it in any DAW), notes.json (rendered by pipeline/tone-render.mjs; audio/mix.py
has a numpy fallback synth) and spotting.json (what was hit where, for checking).
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

# how much energy each layout carries (0..1); the music follows it
ENERGY = {"title": 1.0, "number": 0.85, "crowd": 0.8, "hero": 0.75, "steps": 0.7, "transform": 0.7, "compare": 0.7,
          "news": 0.65, "image": 0.6, "duo": 0.6, "name_card": 0.6, "host_talk": 0.55, "thought": 0.45, "free": 0.55}


def chord(root, scale, degree, octave=0, size=3):
    out = []
    for k in range(size):
        d = degree + 2 * k
        out.append(root + 12 * octave + scale[d % 7] + 12 * (d // 7))
    return out


def fit_grid(bpm0, hits, duration):
    """Pick the tempo and downbeat phase that put the weighted hits closest to beats (big ones to bars)."""
    if not hits:
        return bpm0, 0.0
    best = (1e9, bpm0, 0.0)
    bpm = bpm0 * 0.92
    while bpm <= bpm0 * 1.08:
        beat = 60.0 / bpm
        bar = beat * 4
        for k in range(0, 40):
            phase = beat * k / 40
            cost = 0.0
            for h in hits:
                grid = bar if h["big"] else beat / (1 if h["w"] >= 1 else 2)
                d = ((h["t"] - phase) % grid)
                d = min(d, grid - d)
                cost += h["w"] * min(d, 0.18) ** 2
            cost += 0.0004 * ((bpm - bpm0) / bpm0 * 100) ** 2  # stay near the mood's tempo
            if cost < best[0]:
                best = (cost, bpm, phase)
        bpm += 0.25
    return round(best[1], 2), round(best[2], 4)


def compose(duration, mood, seed=7, spot=None):
    m = MOODS.get(mood, MOODS["playful"])
    rnd = random.Random(seed)
    spot = spot or {}
    scenes = spot.get("scenes", [])
    voiced = spot.get("voiced", [])
    speech_end = max([b for a, b in voiced], default=duration - 0.5)

    # ---- spotting map: which moments the music answers, and how ----
    hits = []
    for i, s in enumerate(scenes):
        if i == 0:
            continue
        t = s["start"]
        if s.get("layout") == "title":
            hits.append(dict(t=t, kind="anticipation", big=True, w=3.0, why="title card"))
        elif s.get("transition") in ("whip", "zoom", "flash", "iris"):
            hits.append(dict(t=t, kind="direct", big=False, w=1.5, why=f"{s['transition']} transition"))
        elif s.get("layout") == "number":
            hits.append(dict(t=t, kind="aftermath", big=False, w=1.0, why="number reveal"))
        else:
            hits.append(dict(t=t, kind="none", big=False, w=0.4, why="cut"))
    for t in spot.get("cuts", []):  # legacy: plain list of cut times
        hits.append(dict(t=t, kind="direct", big=False, w=1.0, why="cut"))
    end_hit = min(duration - 0.2, speech_end + 0.25)

    bpm, phase = fit_grid(m["bpm"], [h for h in hits if h["kind"] != "none"] + [dict(t=end_hit, big=True, w=2.0)], duration)
    beat = 60.0 / bpm
    bar = beat * 4
    # start the grid one bar early so a pickup can sound before the phase point
    t_first = phase - bar if phase > 0.05 else 0.0
    n_bars = int((duration - t_first) / bar) + 2

    pm = pretty_midi.PrettyMIDI(initial_tempo=bpm)
    inst = {}

    def I(role, drum=False):
        if role not in inst:
            i = pretty_midi.Instrument(program=GM.get(role, 0), is_drum=drum, name=role)
            inst[role] = i
            pm.instruments.append(i)
        return inst[role]

    def note(role, pitch, start, dur, vel, drum=False):
        if start < 0 or start >= duration + 2.5:
            return
        I(role, drum).notes.append(pretty_midi.Note(velocity=int(max(1, min(127, vel))), pitch=int(pitch), start=start, end=start + dur))

    def talking(t0, t1):
        return any(a < t1 and b > t0 for a, b in voiced)

    def energy_at(t):
        e = 0.55
        for s in scenes:
            if s["start"] <= t:
                e = ENERGY.get(s.get("layout", "host_talk"), 0.55)
        lift = 0.15 * max(0.0, (t / max(1.0, duration) - 0.7) / 0.3)  # build towards the end
        return min(1.0, e + lift)

    # snapped hit times + per-bar markers
    for h in hits:
        g = bar if h["big"] else beat
        h["at"] = round(phase + round((h["t"] - phase) / g) * g, 3)
        if h["big"] and abs(h["at"] - h["t"]) > 0.11:  # no bar line near: settle for the nearest beat
            h["at"] = round(phase + round((h["t"] - phase) / beat) * beat, 3)
        if abs(h["at"] - h["t"]) > 0.11 and h["kind"] != "none":  # still off the picture: don't hit it
            h["why"] += " (off the beat grid, left unhit)"
            h["kind"] = "none"
        h["off_ms"] = round((h["at"] - h["t"]) * 1000)
    stops = {round(h["at"] - beat, 3) for h in hits if h["kind"] == "anticipation"}  # band rests on the beat before
    fills = {int((h["at"] - t_first - 0.01) // bar) for h in hits if h["kind"] in ("anticipation", "direct") and h["big"]}
    accents = [h["at"] for h in hits if h["kind"] in ("direct", "anticipation")]
    afters = [h["at"] for h in hits if h["kind"] == "aftermath"]

    def resting(t):
        return any(s - 0.01 <= t < s + beat - 0.01 for s in stops)

    root, scale, prog = m["root"], m["scale"], m["prog"]
    motif = [rnd.choice([0, 2, 4, 2, 4, 5, 7]) for _ in range(8)]
    arp_pat = rnd.choice([[0, 1, 2, 1], [0, 2, 1, 2], [0, 1, 2, 3]])
    dr = m["drums"]

    for b in range(n_bars):
        t0 = t_first + b * bar
        if t0 > end_hit + 0.01:
            break
        deg = prog[b % len(prog)]
        e = energy_at(t0 + bar / 2)
        vel = 0.75 + 0.35 * e
        intro = t0 < (voiced[0][0] if voiced else bar) - 0.01 and b < 2
        last_bar = t0 + bar > end_hit - 0.01
        ch = chord(root, scale, deg, 0, 4)
        # bass: root on the downbeat, fifth on beat 3; busier with more energy
        bpat = [0, 2] if (mood in ("space", "calm", "epic") or e < 0.6) else [0, 1.5, 2, 3]
        if not intro or mood in ("epic", "space"):
            for k, bt in enumerate(bpat):
                t = t0 + bt * beat
                if resting(t) or t >= end_hit - 0.01:
                    continue
                p = ch[0] - 24 + (7 if (bt == 2 and mood not in ("space", "calm")) else 0)
                note("bass", p, t, beat * (1.8 if len(bpat) == 2 else 0.8), (82 if k == 0 else 70) * vel)
        # pad / harmony
        if m["pad"] or m["chords"] == "pad":
            for p in ch[:3]:
                note("pad", p, t0, min(bar * 0.98, max(0.1, end_hit - t0)), 52 * vel)
        if m["chords"] in ("pluck", "marimba") and not intro:
            for k in range(8):
                t = t0 + k * beat / 2
                if resting(t) or t >= end_hit - 0.01:
                    continue
                if e < 0.6 and k % 2:  # calmer scenes: quarter notes only
                    continue
                p = ch[arp_pat[k % 4] % 4] + (12 if e > 0.8 and k % 2 else 0)
                note(m["chords"], p, t, beat * 0.45, (62 if k % 2 else 74) * vel)
        elif mood == "space":
            for k in range(8):
                t = t0 + k * beat / 2
                if not resting(t) and t < end_hit:
                    note("bell", ch[[0, 1, 2, 3, 2, 1, 2, 3][k] % 4] + 12, t, beat * 1.5, (40 + (k % 2) * 10) * vel)
        # lead melody: only in the voice's pauses (and before / after it), harmony-locked
        for k in range(8):
            t = t0 + k * beat / 2
            if t >= end_hit - beat * 0.5 or resting(t):
                continue
            if talking(t - 0.12, t + beat * 0.45):
                continue
            if rnd.random() < (0.35 if k % 2 else 0.1):  # leave air, mostly on off-beats
                continue
            strong = k % 2 == 0
            d = motif[(k + b) % len(motif)] + deg
            if strong:  # chord tone: snap the degree to deg, deg+2 or deg+4
                d = deg + min((0, 2, 4, 7), key=lambda x: abs(deg + x - d))
            p = root + 12 + scale[d % 7] + 12 * (d // 7)
            note(m["lead"], p, t, beat * 0.42, (68 + rnd.randint(-6, 6)) * vel)
        # drums follow the intensity curve
        if dr != "none" and not intro and not last_bar:
            for k in range(4):
                tb = t0 + k * beat
                if resting(tb):
                    continue
                if dr in ("light", "full"):
                    if k in (0, 2) and (e >= 0.5 or k == 0):
                        note("kick", 36, tb, 0.1, (90 if k == 0 else 70) * vel, True)
                    if k in (1, 3) and e >= 0.5:
                        note("snare", 39 if dr == "light" else 38, tb, 0.1, 70 * vel, True)
                    note("hat", 42, tb + beat / 2, 0.05, 48 * vel, True)
                    if dr == "full" or e > 0.85:
                        note("hat", 42, tb, 0.05, 40 * vel, True)
                elif dr == "shaker":
                    note("shaker", 70, tb, 0.05, 50 * vel, True)
                    if e >= 0.55:
                        note("shaker", 70, tb + beat / 2, 0.05, 34 * vel, True)
                    if k == 0:
                        note("kick", 36, tb, 0.1, 64 * vel, True)
                elif dr == "toms":
                    if k == 0 or (k == 2 and b % 2):
                        note("tom", 45, tb, 0.2, 84 * vel, True)
            # turnaround fill in the bar that leads into a big hit
            if b in fills:
                for k in range(4):
                    tf = t0 + 3 * beat + k * beat / 4
                    if not resting(tf):
                        note("snare" if dr != "toms" else "tom", [38, 38, 45, 43][k] if dr != "toms" else [45, 45, 43, 41][k], tf, 0.08, (60 + k * 8) * vel, True)
        elif b in fills and not resting(t0 + 3 * beat):  # no drums: a rising run of chord tones instead
            for k in range(4):
                note(m["lead"], ch[k % 4] + 12, t0 + 3 * beat + k * beat / 4, beat / 4, 58 + k * 6)

    # accents: direct hits and the landing after an anticipation
    for t in accents:
        if dr != "none":
            note("crash", 49, t, 0.6, 52, True)
            note("kick", 36, t, 0.1, 96, True)
        for p in chord(root, scale, 0, 1, 3):
            note(m["lead"], p, t, beat * 0.6, 70)
    for t in afters:  # aftermath: a held chord that lets the moment ring
        for p in chord(root, scale, 4, 0, 3):
            note("pad", p, t + beat * 0.5, bar, 50)
    # the ending lands on the tonic, on a beat, after the last word
    for p in chord(root, scale, 0, 0, 3):
        note("pad" if m["pad"] else m["chords"], p, end_hit, 2.5, 62)
    note("bass", root - 24, end_hit, 2.5, 72)
    if dr != "none":
        note("crash", 49, end_hit, 1.0, 46, True)

    report = {"bpm": bpm, "phase": phase, "end_hit": round(end_hit, 3),
              "hits": [{k: h[k] for k in ("t", "at", "off_ms", "kind", "why")} for h in hits]}
    return pm, bpm, report


def main():
    build = Path(sys.argv[1])
    duration = float(sys.argv[2])
    mood = sys.argv[3] if len(sys.argv) > 3 else "playful"
    seed = int(sys.argv[4]) if len(sys.argv) > 4 else 7
    spot = {}
    if len(sys.argv) > 5:
        arg = sys.argv[5]
        if arg.endswith(".json") and Path(arg).exists():
            spot = json.loads(Path(arg).read_text(encoding="utf-8"))
        else:
            spot = {"cuts": json.loads(arg)}
    pm, bpm, report = compose(duration, mood, seed, spot)
    build.mkdir(parents=True, exist_ok=True)
    pm.write(str(build / "score.mid"))
    data = {"bpm": bpm, "mood": mood, "duration": duration, "tracks": []}
    for i in pm.instruments:
        data["tracks"].append({"role": i.name, "drum": i.is_drum, "notes": [[round(n.start, 4), round(n.end - n.start, 4), n.pitch, n.velocity] for n in i.notes]})
    (build / "notes.json").write_text(json.dumps(data), encoding="utf-8")
    (build / "spotting.json").write_text(json.dumps(report, indent=1), encoding="utf-8")
    print(json.dumps({"mood": mood, "bpm": bpm, "phase": report["phase"], "hits": sum(1 for h in report["hits"] if h["kind"] != "none"),
                      "tracks": [t["role"] for t in data["tracks"]], "notes": sum(len(t["notes"]) for t in data["tracks"])}))


if __name__ == "__main__":
    main()
