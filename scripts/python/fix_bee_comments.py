"""Normalize Bee comment markers inside <pre> code blocks: `**` -> `--`.

Only line-leading markers are rewritten so the `**` power operator in prose
and reference tables stays untouched.
"""

import re
import sys
from pathlib import Path

BEE_DIR = Path(__file__).resolve().parents[2] / "projects" / "bee"

PRE_BLOCK = re.compile(r"<pre\b.*?</pre>", re.IGNORECASE | re.DOTALL)
LEADING_COMMENT = re.compile(r"(?m)^([^\S\n]*(?:<[^>]+>[^\S\n]*)*)\*\*")


def fix_block(match: re.Match) -> str:
    return LEADING_COMMENT.sub(r"\1--", match.group(0))


def main() -> int:
    changed = 0
    for path in sorted(BEE_DIR.rglob("*.html")):
        original = path.read_text(encoding="utf-8")
        updated = PRE_BLOCK.sub(fix_block, original)
        if updated != original:
            path.write_text(updated, encoding="utf-8")
            replaced = len(LEADING_COMMENT.findall(original)) - len(
                LEADING_COMMENT.findall(updated)
            )
            print(f"[FIX] {path.relative_to(BEE_DIR.parent.parent)} ({replaced} lines)")
            changed += 1
    print(f"Done. {changed} file(s) updated.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
