#!/usr/bin/env python3
"""Generate feminine Romanian TTS audio files and attach reusable table controls.

This script scans roadmap/romanian/vocabulary.html, extracts the first column text
from each vocabulary table row, generates MP3 files with Edge TTS, and rewrites rows
to include a dedicated play-button column plus a table-level play-all header button.
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


def ensure_external_player_script(soup: BeautifulSoup) -> None:
    legacy_inline = soup.find("script", attrs={"id": "vocab-inline-audio-player"})
    if legacy_inline is not None:
        legacy_inline.decompose()

    if soup.find("script", attrs={"src": "/assets/js/AutoPlayVocabulary.js"}) is None:
        script_tag = soup.new_tag("script", src="/assets/js/AutoPlayVocabulary.js")
        script_tag["defer"] = ""
        body_tag = soup.body
        if body_tag is not None:
            body_tag.append(script_tag)


def ensure_table_header_button(table, soup: BeautifulSoup) -> None:
    header_row = table.select_one("thead tr")
    if header_row is None:
        return

    header_cells = header_row.find_all("th", recursive=False)
    if not header_cells:
        return

    if len(header_cells) > 1 and "row-audio-head" in (header_cells[1].get("class") or []):
        header_button_cell = header_cells[1]
        header_button_cell.clear()
    else:
        header_button_cell = soup.new_tag("th", **{"class": "text-center row-audio-head", "scope": "col"})
        header_cells[0].insert_after(header_button_cell)

    button = soup.new_tag(
        "button",
        type="button",
        **{
            "class": "btn btn-sm btn-info table-play-all-btn",
            "title": "Play all rows in loop",
            "aria-label": "Play all rows in loop",
            "aria-pressed": "false",
        },
    )
    icon = soup.new_tag("i", **{"class": "bi bi-play-circle-fill me-1"})
    button.append(icon)
    button.append("Play all")
    header_button_cell.append(button)


def link_terms_in_html(soup: BeautifulSoup, term_to_file: dict[str, str]) -> int:
    updated = 0
    for table in soup.select("main table"):
        ensure_table_header_button(table, soup)

    for row in soup.select("main table tbody tr"):
        columns = row.find_all("td")
        if len(columns) < 2:
            continue

        first_col = columns[0]

        term = first_col.get_text(" ", strip=True)
        if term not in term_to_file:
            continue

        href = rel_audio_href(term_to_file[term])
        button_col_exists = len(columns) > 1 and "row-audio-cell" in (columns[1].get("class") or [])

        if button_col_exists:
            button_col = columns[1]
            english_col = columns[2] if len(columns) > 2 else None
        else:
            button_col = None
            english_col = columns[1]

        if english_col is None:
            continue

        if english_col.find("span", class_="align-middle") is not None:
            english_text = english_col.find("span", class_="align-middle").get_text(" ", strip=True)
        else:
            english_text = english_col.get_text(" ", strip=True)

        first_col.clear()
        first_col.string = term

        if button_col is None:
            button_col = soup.new_tag("td", **{"class": "text-center row-audio-cell"})
            english_col.insert_before(button_col)
        else:
            button_col.clear()
            button_col["class"] = "text-center row-audio-cell"

        btn_tag = soup.new_tag(
            "button",
            type="button",
            **{
                "class": "btn btn-sm btn-outline-info row-audio-btn align-middle",
                "data-audio": href,
                "title": f"Play audio for '{term}'",
                "aria-label": f"Play audio for {term}",
                "aria-pressed": "false",
            },
        )
        icon_tag = soup.new_tag("i", **{"class": "bi bi-play-fill"})
        btn_tag.append(icon_tag)

        button_col.append(btn_tag)
        english_col.clear()
        english_col.string = english_text
        updated += 1

    ensure_external_player_script(soup)
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
