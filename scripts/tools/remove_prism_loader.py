#!/usr/bin/env python3
"""Remove obsolete prism-loader.js includes from roadmap pages.

The site renders all code with ONE Prism bundle (/assets/prism.css +
/assets/prism.js); per-page `data-lang` + `prism-loader.js` includes are
leftovers of the old dynamic language loading and are not needed.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TARGET_DIR = ROOT / "roadmap" / "csharp"

changed: list[str] = []
for path in sorted(TARGET_DIR.glob("*.html")):
    lines = path.read_text(encoding="utf-8").splitlines(keepends=True)
    kept = [line for line in lines if "prism-loader.js" not in line]
    if len(kept) != len(lines):
        path.write_text("".join(kept), encoding="utf-8")
        changed.append(path.relative_to(ROOT).as_posix())

print(f"removed prism-loader.js from {len(changed)} file(s)")
for name in changed:
    print(" -", name)
