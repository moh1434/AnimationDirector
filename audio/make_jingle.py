"""Smoke test / starter: write a short MIDI jingle with pretty_midi,
synthesize it, and polish it with pedalboard effects.

Run from the project root:
    uv run audio/make_jingle.py
Outputs go to out/ (git-ignored).
"""

from pathlib import Path

import numpy as np
import pretty_midi
from pedalboard import Compressor, Gain, Pedalboard, Reverb
from pedalboard.io import AudioFile

SAMPLE_RATE = 44100
OUT = Path(__file__).resolve().parent.parent / "out"


def build_midi() -> pretty_midi.PrettyMIDI:
    pm = pretty_midi.PrettyMIDI(initial_tempo=120)
    piano = pretty_midi.Instrument(program=pretty_midi.instrument_name_to_program("Celesta"))
    # A bright "ding-ding-ding... reveal" motif (C major arpeggio).
    notes = ["C5", "E5", "G5", "C6", "G5", "C6"]
    t = 0.0
    for i, name in enumerate(notes):
        dur = 0.6 if i == len(notes) - 1 else 0.2
        piano.notes.append(
            pretty_midi.Note(velocity=100, pitch=pretty_midi.note_name_to_number(name), start=t, end=t + dur)
        )
        t += 0.25
    pm.instruments.append(piano)
    return pm


def main() -> None:
    OUT.mkdir(exist_ok=True)
    pm = build_midi()
    pm.write(str(OUT / "jingle.mid"))

    # pretty_midi's built-in synth is simple sine waves -- fine for tests.
    # For real instruments: pm.fluidsynth(sf2_path=...) or load a VST3 with pedalboard.load_plugin().
    audio = pm.synthesize(fs=SAMPLE_RATE).astype(np.float32)
    audio /= max(1e-9, float(np.abs(audio).max()))
    audio = np.concatenate([audio, np.zeros(SAMPLE_RATE, dtype=np.float32)])  # room for the reverb tail

    board = Pedalboard([Compressor(threshold_db=-18, ratio=3), Reverb(room_size=0.6, wet_level=0.3), Gain(gain_db=-3)])
    processed = board(audio[np.newaxis, :], SAMPLE_RATE)

    with AudioFile(str(OUT / "jingle.wav"), "w", SAMPLE_RATE, processed.shape[0]) as f:
        f.write(processed)
    print(f"Wrote {OUT / 'jingle.mid'} and {OUT / 'jingle.wav'}")


if __name__ == "__main__":
    main()
