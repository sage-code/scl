#!/usr/bin/env python3
"""Fix Rust roadmap heading levels: promote the page title <h2> to <h1>,
promote overview sub-headings, and drop the per-page References block
(references belong only on the index and references.html)."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TRACK = ROOT / "roadmap" / "rust"

TITLE_FIXES = {
    "concurrency.html": ('<h2 id="rust-concurrency">Rust Concurrency</h2>', '<h1 id="rust-concurrency">Rust Concurrency</h1>'),
    "control.html": ('<h2 id="control-flow">Control Flow</h2>', '<h1 id="control-flow">Control Flow</h1>'),
    "errors.html": ('<h2 id="rust-errors">Rust Errors</h2>', '<h1 id="rust-errors">Rust Errors</h1>'),
    "modules.html": ('<h2 id="rust-modules">Rust Modules</h2>', '<h1 id="rust-modules">Rust Modules</h1>'),
    "packages.html": ('<h2 id="rust-packages">Rust Packages</h2>', '<h1 id="rust-packages">Rust Packages</h1>'),
    "overview.html": ('<h2 id="rust-overview">Rust Overview</h2>', '<h1 id="rust-overview">Rust Overview</h1>'),
}

OTHER_FIXES = {
    "overview.html": [
        ("<h3 id=\"rusts-strengths\">Rust's strengths</h3>", "<h2 id=\"rusts-strengths\">Rust's strengths</h2>"),
        ("<h3 id=\"rusts-weaknesses\">Rust's weaknesses</h3>", "<h2 id=\"rusts-weaknesses\">Rust's weaknesses</h2>"),
    ],
}

for name, (old, new) in TITLE_FIXES.items():
    path = TRACK / name
    text = path.read_text(encoding="utf-8")
    if old in text:
        path.write_text(text.replace(old, new), encoding="utf-8")
        print(f"[OK] {name}: title -> h1")
    else:
        print(f"[--] {name}: title tag not found")

for name, fixes in OTHER_FIXES.items():
    path = TRACK / name
    text = path.read_text(encoding="utf-8")
    changed = False
    for old, new in fixes:
        if old in text:
            text = text.replace(old, new)
            changed = True
    if changed:
        path.write_text(text, encoding="utf-8")
        print(f"[OK] {name}: promoted sub-headings")
    else:
        print(f"[--] {name}: no sub-heading fix")

# errors.html: drop the per-page References block (and the manual "Go back" footer)
path = TRACK / "errors.html"
text = path.read_text(encoding="utf-8")
idx = text.find('<h2 id="references">References</h2>')
if idx != -1:
    end = text.find('</main>', idx)
    if end != -1:
        path.write_text(text[:idx] + text[end:], encoding="utf-8")
        print("[OK] errors.html: dropped per-page References block")
    else:
        print("[!!] errors.html: closing </main> not found")
else:
    print("[--] errors.html: no References block")
print("done")
