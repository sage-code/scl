#!/usr/bin/env python3
"""`npm run check` helper — verify GENERATED output in public/.

Checks (fail the run):
- Every public/roadmap/**/data/*.json parses and is hierarchical.
- Every full HTML page under public/roadmap and public/projects contains
  exactly one <footer> (build-time injection integrity).
- Every full HTML page is readable and properly closed.

Prerequisite: `npm run build` must have produced public/.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from validation_lib import read_text, sidebar_issues, validate_json_syntax  # noqa: E402

PUBLIC_DIR = ROOT / "public"
FOOTER_RE = re.compile(r"<footer\b", re.IGNORECASE)
FOOTER_SCOPES = [PUBLIC_DIR / "roadmap", PUBLIC_DIR / "projects"]

failures: list[str] = []
warnings: list[str] = []


def fail(msg: str) -> None:
    failures.append(msg)
    print(f"[FAIL] {msg}")


def warn(msg: str) -> None:
    warnings.append(msg)
    print(f"[WARN] {msg}")


def check_json(path: Path) -> None:
    rel = path.relative_to(ROOT).as_posix()
    err, data = validate_json_syntax(read_text(path))
    if err:
        fail(f"{rel}: {err}")
        return
    if "/data/" in rel:
        for level, msg in sidebar_issues(data, rel):
            warn(msg) if level == "warn" else fail(msg)


def check_html(path: Path) -> None:
    rel = path.relative_to(ROOT).as_posix()
    text = read_text(path)
    if "<html" not in text.lower():
        return  # fragment
    if "</html>" not in text.lower():
        fail(f"{rel}: missing closing </html> tag")
    if any(path.is_relative_to(scope) for scope in FOOTER_SCOPES):
        footer_count = len(FOOTER_RE.findall(text))
        if footer_count != 1:
            fail(f"{rel}: expected exactly one <footer> (found {footer_count})")


def main() -> int:
    if not PUBLIC_DIR.exists():
        print("public/ not found. Run `npm run build` first.")
        return 1

    print("Verifying generated output in public/...")
    checked = 0

    for path in sorted(PUBLIC_DIR.rglob("*.json")):
        check_json(path)
        checked += 1
    for path in sorted(PUBLIC_DIR.rglob("*.html")):
        check_html(path)
        checked += 1

    print(f"Checked {checked} generated file(s).")

    if failures:
        print(f"\n{len(failures)} public check failure(s) found.")
        return 1
    if warnings:
        print(f"\n{len(warnings)} content warning(s) — see above.")
    print("All public checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
