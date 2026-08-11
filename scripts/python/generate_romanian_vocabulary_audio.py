#!/usr/bin/env python3
"""Generate feminine Romanian TTS audio files and link each Romanian row term.

This script scans roadmap/romanian/vocabulary.html, extracts the first column text
from each vocabulary table row, generates MP3 files with Edge TTS, and rewrites the
first column so every term links to its audio file.
"""

from __future__ import annotations

import argparse
import asyncio
import hashlib
import re
import unicodedata
from pathlib import Path

from bs4 import BeautifulSoup
import edge_tts


VOICE = "ro-RO-AlinaNeural"  # Feminine Romanian neural voice.


def slugify(text: str) -> str:
    normalized = unicodedata.normalize("NFD", text.lower())
    ascii_only = "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_only).strip("-")
    if not slug:
        digest = hashlib.sha1(text.encode("utf-8")).hexdigest()[:10]
        slug = f"term-{digest}"
    return slug


async def generate_audio_file(text: str, out_file: Path) -> None:
    communicator = edge_tts.Communicate(text, VOICE)
    await communicator.save(str(out_file))


def extract_terms(soup: BeautifulSoup) -> list[str]:
    terms: list[str] = []
    for row in soup.select("main table tbody tr"):
        first_col = row.find("td")
        if first_col is None:
            continue
        term = first_col.get_text(" ", strip=True)
        if term:
            terms.append(term)
    return terms


def rel_audio_href(file_name: str) -> str:
    return f"/roadmap/romanian/audio/vocabulary/{file_name}"


def link_terms_in_html(soup: BeautifulSoup, term_to_file: dict[str, str]) -> int:
    updated = 0
    for row in soup.select("main table tbody tr"):
        first_col = row.find("td")
        if first_col is None:
            continue
        term = first_col.get_text(" ", strip=True)
        if term not in term_to_file:
            continue

        href = rel_audio_href(term_to_file[term])
        first_col.clear()

        a_tag = soup.new_tag(
            "a",
            href=href,
            **{
                "class": "word-audio-link fw-semibold text-decoration-none",
                "target": "_blank",
                "rel": "noopener noreferrer",
                "title": f"Open audio for '{term}'",
                "aria-label": f"Open audio for {term}",
            },
        )
        a_tag.string = term

        icon_tag = soup.new_tag(
            "a",
            href=href,
            **{
                "class": "ms-2 text-info",
                "target": "_blank",
                "rel": "noopener noreferrer",
                "title": f"Play audio for '{term}'",
                "aria-label": f"Play audio for {term}",
            },
        )
        i_tag = soup.new_tag("i", **{"class": "bi bi-volume-up-fill"})
        icon_tag.append(i_tag)

        first_col.append(a_tag)
        first_col.append(icon_tag)
        updated += 1

    return updated


async def main() -> None:
    parser = argparse.ArgumentParser(description="Generate Romanian vocabulary row audio files")
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Regenerate MP3 files even if they already exist.",
    )
    parser.add_argument(
        "--link-only",
        action="store_true",
        help="Only link existing MP3 files in HTML; do not generate missing files.",
    )
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[2]
    html_file = repo_root / "roadmap" / "romanian" / "vocabulary.html"
    audio_dir = repo_root / "roadmap" / "romanian" / "audio" / "vocabulary"
    audio_dir.mkdir(parents=True, exist_ok=True)

    html_content = html_file.read_text(encoding="utf-8")
    soup = BeautifulSoup(html_content, "lxml")

    terms = extract_terms(soup)
    unique_terms = list(dict.fromkeys(terms))

    term_to_file: dict[str, str] = {}
    for term in unique_terms:
        base = slugify(term)
        name = f"{base}.mp3"
        candidate = audio_dir / name
        if candidate.exists() and not args.overwrite:
            term_to_file[term] = name
            continue

        if args.link_only:
            continue

        if not candidate.exists() or args.overwrite:
            await generate_audio_file(term, candidate)
        term_to_file[term] = name

    updated_rows = link_terms_in_html(soup, term_to_file)
    html_file.write_text(str(soup), encoding="utf-8")

    print(f"Unique terms: {len(unique_terms)}")
    print(f"Rows linked: {updated_rows}")
    print(f"Audio folder: {audio_dir}")


if __name__ == "__main__":
    asyncio.run(main())
