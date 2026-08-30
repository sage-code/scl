#!/usr/bin/env python3
"""Generate Romanian question/answer audio files and attach reusable table controls."""

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


def extract_phrases(soup: BeautifulSoup) -> list[str]:
    phrases: list[str] = []
    for row in soup.select("main table tbody tr"):
        columns = row.find_all("td")
        if len(columns) < 4:
            continue
        phrases.extend([
            columns[1].get_text(" ", strip=True),
            columns[2].get_text(" ", strip=True),
            columns[3].get_text(" ", strip=True),
        ])
    return [phrase for phrase in phrases if phrase]


def rel_audio_href(file_name: str) -> str:
    return f"/roadmap/romanian/audio/questions/{file_name}"


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


def create_audio_button(soup: BeautifulSoup, text: str, href: str):
    button = soup.new_tag(
        "button",
        type="button",
        **{
            "class": "btn btn-sm btn-outline-info row-audio-btn align-middle",
            "data-audio": href,
            "aria-label": f"Play audio for {text}",
            "aria-pressed": "false",
        },
    )
    icon = soup.new_tag("i", **{"class": "bi bi-play-fill"})
    button.append(icon)
    return button


def link_questions_in_html(soup: BeautifulSoup, phrase_to_file: dict[str, str]) -> int:
    updated = 0
    for table in soup.select("main table"):
        ensure_table_header_button(table, soup)

    for row in soup.select("main table tbody tr"):
        columns = row.find_all("td")
        if len(columns) < 4:
            continue

        number_col = columns[0]
        question_col = columns[1]
        answer1_col = columns[2]
        answer2_col = columns[3]

        question_text = question_col.get_text(" ", strip=True)
        answer1_text = answer1_col.get_text(" ", strip=True)
        answer2_text = answer2_col.get_text(" ", strip=True)
        if not question_text or not answer1_text or not answer2_text:
            continue

        question_href = rel_audio_href(phrase_to_file[question_text])
        answer1_href = rel_audio_href(phrase_to_file[answer1_text])
        answer2_href = rel_audio_href(phrase_to_file[answer2_text])

        audio_cols_exist = len(columns) > 6 and all(
            "row-audio-cell" in (columns[index].get("class") or []) for index in (2, 4, 6)
        )

        number_text = number_col.get_text(" ", strip=True)

        if audio_cols_exist:
            question_audio_col = columns[2]
            answer1_col = columns[3]
            answer1_audio_col = columns[4]
            answer2_col = columns[5]
            answer2_audio_col = columns[6]
        else:
            question_audio_col = soup.new_tag("td", **{"class": "text-center row-audio-cell"})
            answer1_audio_col = soup.new_tag("td", **{"class": "text-center row-audio-cell"})
            answer2_audio_col = soup.new_tag("td", **{"class": "text-center row-audio-cell"})
            question_col.insert_after(question_audio_col)
            answer1_col.insert_after(answer1_audio_col)
            answer2_col.insert_after(answer2_audio_col)

        number_col.clear()
        number_col.string = number_text
        question_col.clear()
        question_col.string = question_text
        answer1_col.clear()
        answer1_col.string = answer1_text
        answer2_col.clear()
        answer2_col.string = answer2_text

        question_audio_col.clear()
        question_audio_col["class"] = "text-center row-audio-cell"
        question_audio_col.append(create_audio_button(soup, question_text, question_href))

        answer1_audio_col.clear()
        answer1_audio_col["class"] = "text-center row-audio-cell"
        answer1_audio_col.append(create_audio_button(soup, answer1_text, answer1_href))

        answer2_audio_col.clear()
        answer2_audio_col["class"] = "text-center row-audio-cell"
        answer2_audio_col.append(create_audio_button(soup, answer2_text, answer2_href))
        updated += 1

    ensure_external_player_script(soup)
    return updated


async def main() -> None:
    parser = argparse.ArgumentParser(description="Generate Romanian question audio files")
    parser.add_argument("--overwrite", action="store_true", help="Regenerate MP3 files even if they already exist.")
    parser.add_argument("--link-only", action="store_true", help="Only link existing MP3 files in HTML; do not generate missing files.")
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[2]
    html_file = repo_root / "roadmap" / "romanian" / "questions.html"
    audio_dir = repo_root / "roadmap" / "romanian" / "audio" / "questions"
    audio_dir.mkdir(parents=True, exist_ok=True)

    soup = BeautifulSoup(html_file.read_text(encoding="utf-8"), "lxml")
    phrases = extract_phrases(soup)
    unique_phrases = list(dict.fromkeys(phrases))

    phrase_to_file: dict[str, str] = {}
    for phrase in unique_phrases:
        file_name = f"{slugify(phrase)}.mp3"
        candidate = audio_dir / file_name

        if candidate.exists() and not args.overwrite:
            phrase_to_file[phrase] = file_name
            continue

        if args.link_only:
            continue

        if not candidate.exists() or args.overwrite:
            await generate_audio_file(phrase, candidate)
        phrase_to_file[phrase] = file_name

    updated_rows = link_questions_in_html(soup, phrase_to_file)
    html_file.write_text(str(soup), encoding="utf-8")

    print(f"Unique phrases: {len(unique_phrases)}")
    print(f"Rows linked: {updated_rows}")
    print(f"Audio folder: {audio_dir}")


if __name__ == "__main__":
    asyncio.run(main())