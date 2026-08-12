#!/usr/bin/env python3
"""Generate MP3 pronunciation clips for the English alphabet lesson.

Each output audio contains the letter name and an example word, for example:
"A, apple". Files are written to roadmap/english/audio/alphabet.
"""

from __future__ import annotations

import argparse
import asyncio
from pathlib import Path

import edge_tts


VOICE = "en-US-JennyNeural"

LETTER_EXAMPLES = [
    ("a", "A, apple"),
    ("b", "B, book"),
    ("c", "C, city"),
    ("d", "D, dog"),
    ("e", "E, energy"),
    ("f", "F, family"),
    ("g", "G, garden"),
    ("h", "H, house"),
    ("i", "I, idea"),
    ("j", "J, job"),
    ("k", "K, key"),
    ("l", "L, language"),
    ("m", "M, music"),
    ("n", "N, name"),
    ("o", "O, open"),
    ("p", "P, people"),
    ("q", "Q, question"),
    ("r", "R, around"),
    ("s", "S, sun"),
    ("t", "T, table"),
    ("u", "U, use"),
    ("v", "V, voice"),
    ("w", "W, window"),
    ("x", "X, example"),
    ("y", "Y, yellow"),
    ("z", "Z, zoo"),
]


async def generate_audio_file(text: str, out_file: Path) -> None:
    communicator = edge_tts.Communicate(text, VOICE)
    await communicator.save(str(out_file))


async def main() -> None:
    parser = argparse.ArgumentParser(description="Generate audio for English alphabet lesson")
    parser.add_argument("--overwrite", action="store_true", help="Regenerate existing files")
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[2]
    audio_dir = repo_root / "roadmap" / "english" / "audio" / "alphabet"
    audio_dir.mkdir(parents=True, exist_ok=True)

    generated = 0
    skipped = 0

    for letter, phrase in LETTER_EXAMPLES:
        out_file = audio_dir / f"{letter}.mp3"
        if out_file.exists() and not args.overwrite:
            skipped += 1
            continue
        await generate_audio_file(phrase, out_file)
        generated += 1

    print(f"Generated: {generated}")
    print(f"Skipped: {skipped}")
    print(f"Audio folder: {audio_dir}")


if __name__ == "__main__":
    asyncio.run(main())
