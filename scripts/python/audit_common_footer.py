#!/usr/bin/env python3
"""Audit generated roadmap/projects pages for common footer integrity.

Checks performed:
- Exactly one <footer> tag per HTML page.
- Common footer marker text is present exactly once.
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PUBLIC_DIR = ROOT / "public"
TARGET_DIRS = [PUBLIC_DIR / "roadmap", PUBLIC_DIR / "projects"]

FOOTER_RE = re.compile(r"<footer\b", re.IGNORECASE)
COMMON_MARKER_RE = re.compile(r"Mentorship\s*&(?:amp;)?\s*Resources", re.IGNORECASE)


def iter_html_files(base: Path):
    if not base.exists():
        return
    for file_path in sorted(base.rglob("*.html")):
        yield file_path


def main() -> int:
    total = 0
    duplicate_footer_files: list[Path] = []
    missing_footer_files: list[Path] = []
    marker_mismatch_files: list[Path] = []

    for base in TARGET_DIRS:
        for file_path in iter_html_files(base):
            total += 1
            raw = file_path.read_text(encoding="utf-8", errors="ignore")
            footer_count = len(FOOTER_RE.findall(raw))
            marker_count = len(COMMON_MARKER_RE.findall(raw))

            if footer_count == 0:
                missing_footer_files.append(file_path)
            elif footer_count > 1:
                duplicate_footer_files.append(file_path)

            if marker_count != 1:
                marker_mismatch_files.append(file_path)

    print(f"Scanned HTML pages: {total}")
    print(f"Missing footer: {len(missing_footer_files)}")
    print(f"Duplicate footer: {len(duplicate_footer_files)}")
    print(f"Common footer marker mismatches: {len(marker_mismatch_files)}")

    if missing_footer_files:
        print("\nMissing footer files:")
        for file_path in missing_footer_files[:200]:
            print(f"- {file_path.relative_to(ROOT)}")

    if duplicate_footer_files:
        print("\nDuplicate footer files:")
        for file_path in duplicate_footer_files[:200]:
            print(f"- {file_path.relative_to(ROOT)}")

    if marker_mismatch_files:
        print("\nFooter marker mismatch files:")
        for file_path in marker_mismatch_files[:200]:
            print(f"- {file_path.relative_to(ROOT)}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
