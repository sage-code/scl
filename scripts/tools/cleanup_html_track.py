#!/usr/bin/env python3
"""Clean up the HTML track's legacy artifacts (T1 of the HTML roadmap rebuild).

Deletes, after a reference check:
  - roadmap/html/test.shtml                      (SSI leftover, never deployed)
  - roadmap/html/img/html-quiz.png               (quiz retired from the track)
  - roadmap/html/demo/*                          (unnumbered legacy demos with
    per-file sidebar JSONs — replaced by the numbered demo/<group>/ contract)

The script refuses to delete a file that is still referenced by any tracked
HTML/JSON/MD source outside public/ (the generated tree is not a reference).

Usage:
  python scripts/tools/cleanup_html_track.py --dry-run
  python scripts/tools/cleanup_html_track.py [--force]
"""

import argparse
import os
import glob

DEMO_DIR = os.path.join("roadmap", "html", "demo")
EXTRAS = [
    os.path.join("roadmap", "html", "test.shtml"),
    os.path.join("roadmap", "html", "img", "html-quiz.png"),
]
SCAN_ROOTS = ["roadmap", "projects", "community", "assets", "layouts", "manual", "scripts", "tracking"]


def referenced(filepath):
    """True if any tracked source (not public/, not the file itself) mentions the full path."""
    needles = [
        filepath.replace("\\", "/"),
        filepath.replace("/", "\\"),
    ]
    for root in SCAN_ROOTS:
        for pattern in ("*.html", "*.json", "*.md", "*.py", "*.js", "*.sh"):
            for f in glob.glob(os.path.join(root, "**", pattern), recursive=True):
                if os.path.samefile(os.path.abspath(f), os.path.abspath(filepath)):
                    continue
                if os.path.samefile(os.path.abspath(f), os.path.abspath(__file__)):
                    continue
                try:
                    text = open(f, encoding="utf-8", errors="ignore").read()
                except OSError:
                    continue
                for needle in needles:
                    if needle in text:
                        return f
    return None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    targets = list(EXTRAS)
    if os.path.isdir(DEMO_DIR):
        for f in sorted(glob.glob(os.path.join(DEMO_DIR, "*"))):
            if os.path.isfile(f):
                targets.append(f)

    blocked = 0
    for path in targets:
        ref = referenced(path)
        if ref:
            blocked += 1
            print(f"[blocked] {path} still referenced by {ref}")
            continue
        print(f"[dry-run] would delete {path}" if args.dry_run else f"[delete] {path}")
        if not args.dry_run and os.path.exists(path):
            os.remove(path)

    print(f"\n{len(targets)} target(s), {blocked} blocked")
    if blocked:
        print("Refusing to run: fix references first.")
        return 1
    return 0


if __name__ == "__main__":
    main()
