#!/usr/bin/env python3
"""Generate feminine Romanian TTS audio files and attach inline play buttons.

This script scans roadmap/romanian/vocabulary.html, extracts the first column text
from each vocabulary table row, generates MP3 files with Edge TTS, and rewrites rows
so the first column keeps plain Romanian text while the second column includes a play
button that plays audio inline.
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


def ensure_inline_player_script(soup: BeautifulSoup) -> None:
    script_id = "vocab-inline-audio-player"
    existing = soup.find("script", attrs={"id": script_id})
    if existing is not None:
        existing.decompose()

    script_tag = soup.new_tag("script", id=script_id)
    script_tag.string = (
        "(function(){"
        "const sharedAudio=new Audio();"
        "document.addEventListener('click',function(event){"
        "const btn=event.target.closest('.row-audio-btn');"
        "if(!btn){return;}"
        "event.preventDefault();"
        "const src=btn.getAttribute('data-audio');"
        "if(!src){return;}"
        "if(sharedAudio.src.endsWith(src)&&!sharedAudio.paused){sharedAudio.pause();sharedAudio.currentTime=0;btn.setAttribute('aria-pressed','false');return;}"
        "document.querySelectorAll('.row-audio-btn[aria-pressed=\"true\"]').forEach(function(b){b.setAttribute('aria-pressed','false');});"
        "sharedAudio.src=src;"
        "sharedAudio.play().then(function(){btn.setAttribute('aria-pressed','true');}).catch(function(){});"
        "});"
        "sharedAudio.addEventListener('ended',function(){document.querySelectorAll('.row-audio-btn[aria-pressed=\"true\"]').forEach(function(b){b.setAttribute('aria-pressed','false');});});"
        "})();"
    )

    body_tag = soup.body
    if body_tag is not None:
        body_tag.append(script_tag)


def link_terms_in_html(soup: BeautifulSoup, term_to_file: dict[str, str]) -> int:
    updated = 0
    for row in soup.select("main table tbody tr"):
        columns = row.find_all("td")
        if len(columns) < 2:
            continue
        first_col = columns[0]
        second_col = columns[1]

        term = first_col.get_text(" ", strip=True)
        if term not in term_to_file:
            continue

        href = rel_audio_href(term_to_file[term])
        english_text = second_col.get_text(" ", strip=True)

        first_col.clear()
        first_col.string = term

        second_col.clear()
        btn_tag = soup.new_tag(
            "button",
            type="button",
            **{
                "class": "btn btn-sm btn-outline-info row-audio-btn align-middle me-2",
                "data-audio": href,
                "title": f"Play audio for '{term}'",
                "aria-label": f"Play audio for {term}",
                "aria-pressed": "false",
            },
        )
        icon_tag = soup.new_tag("i", **{"class": "bi bi-play-circle-fill"})
        btn_tag.append(icon_tag)

        text_span = soup.new_tag("span", **{"class": "align-middle"})
        text_span.string = english_text

        second_col.append(btn_tag)
        second_col.append(text_span)
        updated += 1

    ensure_inline_player_script(soup)
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
