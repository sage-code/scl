#!/usr/bin/env python3
"""`npm run test` — verify SOURCE files (the originals).

Scope (source only; public/ is never read):
- JSON (roadmap/, projects/, community/): strict parse; roadmap topic sidebars
  (roadmap/*/data/*.json) must be hierarchical (children lists, titled entries).
- JS (assets/js/, scripts/): node --check syntax validation.
- Python (scripts/): py_compile syntax validation.
- HTML (roadmap/, projects/, community/, layouts/): readable markup. Roadmap
  topic pages (roadmap/<track>/<topic>.html) are additionally checked against
  the heading standard (at least one <h1>, at least one <h2>) — violations are
  reported as warnings (content debt), not failures.

Syntax failures exit 1. Generated output in public/ is verified by
`npm run check` (scripts/check.js).
"""
from __future__ import annotations

import py_compile
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))

from validation_lib import H1_RE, H2_RE, read_text, sidebar_issues, validate_json_syntax  # noqa: E402

HTML_ROOTS = ["roadmap", "projects", "community", "layouts"]
JSON_ROOTS = ["roadmap", "projects", "community"]
JS_ROOTS = ["assets/js", "scripts"]
PY_ROOTS = ["scripts"]

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
    if rel.startswith("roadmap/") and "/data/" in rel:
        for level, msg in sidebar_issues(data, rel):
            warn(msg) if level == "warn" else fail(msg)


def check_js(path: Path) -> None:
    rel = path.relative_to(ROOT).as_posix()
    result = subprocess.run(["node", "--check", str(path)], capture_output=True, text=True)
    if result.returncode != 0:
        detail = (result.stderr or result.stdout or "").strip()
        fail(f"{rel}: invalid JS syntax\n{detail}")


def check_py(path: Path) -> None:
    rel = path.relative_to(ROOT).as_posix()
    try:
        py_compile.compile(str(path), doraise=True)
    except Exception as e:  # py_compile raises on syntax errors
        fail(f"{rel}: invalid Python syntax - {e}")


def check_html(path: Path) -> None:
    rel = path.relative_to(ROOT).as_posix()
    text = read_text(path)
    if "<html" not in text.lower():
        return  # fragment or non-page file, skip
    # Topic-page heading standard applies only to roadmap/<track>/<topic>.html
    # (not track indexes, not root-level auth pages like roadmap/unregister.html).
    parts = rel.split("/")
    is_topic_page = (
        len(parts) == 3
        and parts[0] == "roadmap"
        and parts[2] != "index.html"
    )
    if is_topic_page:
        h1_count = len(H1_RE.findall(text))
        if h1_count < 1:
            warn(f"{rel}: roadmap topic page should have at least one <h1> (found {h1_count})")
        if not H2_RE.search(text):
            warn(f"{rel}: roadmap topic page should contain at least one <h2>")


def main() -> int:
    print("Verifying source files (originals)...")
    checked = 0

    for root in JSON_ROOTS:
        for path in sorted((ROOT / root).rglob("*.json")):
            check_json(path)
            checked += 1
    for root in JS_ROOTS:
        for path in sorted((ROOT / root).rglob("*.js")):
            check_js(path)
            checked += 1
    for root in PY_ROOTS:
        for path in sorted((ROOT / root).rglob("*.py")):
            check_py(path)
            checked += 1
    for root in HTML_ROOTS:
        for path in sorted((ROOT / root).rglob("*.html")):
            check_html(path)
            checked += 1

    print(f"Checked {checked} source file(s).")

    if failures:
        print(f"\n{len(failures)} source check failure(s) found.")
        return 1
    if warnings:
        print(f"\n{len(warnings)} content warning(s) — see heading-standard debt above.")
    print("All source checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
