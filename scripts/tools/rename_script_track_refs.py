#!/usr/bin/env python3
"""javascript track rename: mechanical reference fixes after script -> javascript.

Applies exact, idempotent SEARCH/REPLACE rules to every HTML page under
roadmap/javascript/. Dry-run by default (prints a unified diff per file);
pass --write to apply the changes.

Rules:
  1. Absolute track URLs:  /roadmap/script/  ->  /roadmap/javascript/
     (canonical links, og:url, quiz image links)
  2. TOPIC_CONFIG labId:   'script' -> 'javascript' (only inside the config object)
  3. Prism bundle tag typo: <script src="/assets/prism.js">></script> -> fixed
  4. Topic contract: topic pages must link content-code.css — inserted after the
     content-sidebar.css link when missing (index pages are skipped: they use
     roadmap-index.css, not the content-* set).
"""
import argparse
import difflib
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TRACK = ROOT / "roadmap" / "javascript"

RULES = [
    (re.compile(r"/roadmap/script/"), "/roadmap/javascript/"),
    (
        re.compile(r"(window\.TOPIC_CONFIG\s*=\s*\{[^}]*?labId\s*:\s*)'script'", re.S),
        r"\1'javascript'",
    ),
    (
        re.compile(r'(<script src="/assets/prism\.js")>\s*></script>'),
        r"\1></script>",
    ),
]

CODE_CSS_LINK = '  <link rel="stylesheet" href="/assets/css/content-code.css">\n'


def fix(text: str, rel: str) -> str:
    is_index = rel.endswith("index.html")
    for pattern, repl in RULES:
        text = pattern.sub(repl, text)
    if not is_index and "content-code.css" not in text and "content-sidebar.css" in text:
        text = text.replace(
            '<link rel="stylesheet" href="/assets/css/content-sidebar.css">',
            '<link rel="stylesheet" href="/assets/css/content-sidebar.css">\n'
            '  <link rel="stylesheet" href="/assets/css/content-code.css">',
            1,
        )
    return text


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true", help="apply changes (default: dry-run)")
    args = ap.parse_args()

    changed = 0
    for page in sorted(TRACK.glob("*.html")):
        rel = page.relative_to(ROOT).as_posix()
        original = page.read_text(encoding="utf-8")
        updated = fix(original, rel)
        if updated == original:
            continue
        changed += 1
        if args.write:
            page.write_text(updated, encoding="utf-8", newline="\n")
            print(f"[WRITE] {rel}")
        else:
            print(f"[DRY] {rel}")
            sys_diff = difflib.unified_diff(
                original.splitlines(), updated.splitlines(), fromfile=rel, tofile=rel, lineterm=""
            )
            print("\n".join(list(sys_diff)[:40]))
    print(f"\n{changed} file(s) would change." if not args.write else f"\n{changed} file(s) changed.")


if __name__ == "__main__":
    main()
