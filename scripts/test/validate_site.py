#!/usr/bin/env python3
"""Minimal validation for generated static output before publish."""

from __future__ import annotations

import sys
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PUBLIC_DIR = ROOT / "public"
FORBIDDEN_PUBLIC_DIRS = ["manual", "scripts", "config", ".github"]


def list_html_files() -> list[Path]:
    return sorted(PUBLIC_DIR.rglob("*.html"))


def load_rendered_page_paths() -> list[Path]:
    manifest_file = ROOT / "manual" / "build-manifest.json"
    if not manifest_file.exists():
        return []

    try:
        payload = json.loads(manifest_file.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return []

    rendered = payload.get("renderedPages", [])
    return [PUBLIC_DIR / page for page in rendered]


def check_required_files() -> list[str]:
    required = [
        PUBLIC_DIR / "index.html",
    ]
    failures = []
    for item in required:
        if not item.exists():
            failures.append(f"Missing required file: {item.relative_to(ROOT)}")
    return failures


def check_forbidden_directories() -> list[str]:
    failures = []
    for name in FORBIDDEN_PUBLIC_DIRS:
        candidate = PUBLIC_DIR / name
        if candidate.exists():
            failures.append(f"Forbidden developer directory published: {candidate.relative_to(ROOT)}")
    return failures


def check_semantic_structure(html_files: list[Path]) -> list[str]:
    warnings = []
    for file_path in html_files:
        text = file_path.read_text(encoding="utf-8", errors="ignore").lower()
        # Legacy pages copied as full documents are allowed during incremental rollout.
        if "<html" in text and "<body" in text:
            continue
        if "<main" not in text:
            warnings.append(f"No <main> tag: {file_path.relative_to(ROOT)}")
    return warnings


def main() -> int:
    if not PUBLIC_DIR.exists():
        print("Missing output directory: public")
        return 1

    failures = check_required_files()
    failures.extend(check_forbidden_directories())
    html_files = list_html_files()
    rendered_page_files = [p for p in load_rendered_page_paths() if p.exists()]
    semantic_scope = rendered_page_files if rendered_page_files else html_files
    warnings = check_semantic_structure(semantic_scope)

    print(f"Validated HTML files: {len(html_files)}")
    print(f"Semantic check scope: {len(semantic_scope)} file(s)")
    if failures:
        print("Critical issues:")
        for item in failures:
            print(f"- {item}")

    if warnings:
        print("Warnings:")
        for item in warnings[:25]:
            print(f"- {item}")
        if len(warnings) > 25:
            print(f"- ... {len(warnings) - 25} more warnings")

    if failures:
        return 1

    print("Validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
