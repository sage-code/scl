#!/usr/bin/env python3
"""Generate Romanian imperative audio files and attach reusable table controls."""

from __future__ import annotations

import argparse
import asyncio
import hashlib
import re
import unicodedata
from pathlib import Path

from bs4 import BeautifulSoup
import edge_tts


VOICE = "ro-RO-AlinaNeural"


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


def extract_sentences(soup: BeautifulSoup) -> list[str]:
    sentences: list[str] = []
    for row in soup.select("main table tbody tr"):
        columns = row.find_all("td")
        if len(columns) < 2:
            continue
        sentence = columns[1].get_text(" ", strip=True)
        if sentence:
            sentences.append(sentence)
    return sentences


def rel_audio_href(file_name: str) -> str:
    return f"/roadmap/romanian/audio/imperative/{file_name}"


def ensure_external_player_script(soup: BeautifulSoup) -> None:
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

    if len(header_cells) > 2 and "row-audio-head" in (header_cells[2].get("class") or []):
        header_button_cell = header_cells[2]
        header_button_cell.clear()
    else:
        header_button_cell = soup.new_tag("th", **{"class": "text-center row-audio-head", "scope": "col"})
        header_cells[1].insert_after(header_button_cell)

    button = soup.new_tag(
        "button",
        type="button",
        **{
            "class": "btn btn-sm btn-info table-play-all-btn",
            "aria-label": "Play all rows in loop",
            "aria-pressed": "false",
        },
    )
    icon = soup.new_tag("i", **{"class": "bi bi-play-circle-fill me-1"})
    button.append(icon)
    header_button_cell.append(button)


def link_sentences_in_html(soup: BeautifulSoup, sentence_to_file: dict[str, str]) -> int:
    updated = 0
    for table in soup.select("main table"):
        ensure_table_header_button(table, soup)

    for row in soup.select("main table tbody tr"):
        columns = row.find_all("td")
        if len(columns) < 3:
            continue

        number_col = columns[0]
        sentence_col = columns[1]
        sentence = sentence_col.get_text(" ", strip=True)
        if sentence not in sentence_to_file:
            continue

        href = rel_audio_href(sentence_to_file[sentence])
        button_col_exists = len(columns) > 2 and "row-audio-cell" in (columns[2].get("class") or [])

        if button_col_exists:
            button_col = columns[2]
            english_col = columns[3] if len(columns) > 3 else None
        else:
            button_col = None
            english_col = columns[2]

        if english_col is None:
            continue

        number_text = number_col.get_text(" ", strip=True)
        english_text = english_col.get_text(" ", strip=True)

        number_col.clear()
        number_col.string = number_text
        sentence_col.clear()
        sentence_col.string = sentence

        if button_col is None:
            button_col = soup.new_tag("td", **{"class": "text-center row-audio-cell"})
            english_col.insert_before(button_col)
        else:
            button_col.clear()
            button_col["class"] = "text-center row-audio-cell"

        button = soup.new_tag(
            "button",
            type="button",
            **{
                "class": "btn btn-sm btn-outline-info row-audio-btn align-middle",
                "data-audio": href,
                "aria-label": f"Play audio for {sentence}",
                "aria-pressed": "false",
            },
        )
        icon = soup.new_tag("i", **{"class": "bi bi-play-fill"})
        button.append(icon)

        button_col.append(button)
        english_col.clear()
        english_col.string = english_text
        updated += 1

    ensure_external_player_script(soup)
    return updated


async def main() -> None:
    parser = argparse.ArgumentParser(description="Generate Romanian imperative audio files")
    parser.add_argument("--overwrite", action="store_true", help="Regenerate MP3 files even if they already exist.")
    parser.add_argument("--link-only", action="store_true", help="Only link existing MP3 files in HTML; do not generate missing files.")
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[2]
    html_file = repo_root / "roadmap" / "romanian" / "imperative.html"
    audio_dir = repo_root / "roadmap" / "romanian" / "audio" / "imperative"
    audio_dir.mkdir(parents=True, exist_ok=True)

    soup = BeautifulSoup(html_file.read_text(encoding="utf-8"), "lxml")

    sentences = extract_sentences(soup)
    unique_sentences = list(dict.fromkeys(sentences))

    sentence_to_file: dict[str, str] = {}
    for sentence in unique_sentences:
        file_name = f"{slugify(sentence)}.mp3"
        candidate = audio_dir / file_name

        if candidate.exists() and not args.overwrite:
            sentence_to_file[sentence] = file_name
            continue

        if args.link_only:
            continue

        if not candidate.exists() or args.overwrite:
            await generate_audio_file(sentence, candidate)
        sentence_to_file[sentence] = file_name

    updated_rows = link_sentences_in_html(soup, sentence_to_file)
    html_file.write_text(str(soup), encoding="utf-8")

    print(f"Unique sentences: {len(unique_sentences)}")
    print(f"Rows linked: {updated_rows}")
    print(f"Audio folder: {audio_dir}")


if __name__ == "__main__":
    asyncio.run(main())