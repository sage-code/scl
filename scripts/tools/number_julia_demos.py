#!/usr/bin/env python3
"""Number the Julia demo files to match the roadmap contract.

`manual/ARCHITECTURE.md` §"Demo Example Pages" requires one runnable example per
file named `NN_name.<ext>` inside `roadmap/<track>/demo/`. The Julia demo folder
was created before that rule and its files are unnumbered; nothing in the repo
links to them yet (page 29 `demo_examples.html` does not exist), so renaming is
safe and makes the demo page table sequence match the lesson order.

The script is deterministic and idempotent:

  * every source name maps to exactly one target name (lesson order)
  * a source that is already numbered is left untouched
  * an exact duplicate of another demo is reported and, with --apply, deleted
  * a missing source or an existing target is reported instead of overwritten

Usage:
    python scripts/tools/number_julia_demos.py --dry-run
    python scripts/tools/number_julia_demos.py --apply
"""
import argparse
import hashlib
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
DEMO_DIR = REPO / "roadmap" / "julia" / "demo"

# Lesson order: foundations -> functions and scope -> collections and types ->
# errors and files. The number is the position in the track, not the file name.
RENAMES = [
    ("variables.jl",        "01_variables.jl"),
    ("expressions.jl",      "02_expressions.jl"),
    ("boolean.jl",          "03_boolean.jl"),
    ("condition.jl",        "04_condition.jl"),
    ("decision.jl",         "05_decision.jl"),
    ("ladder.jl",           "06_ladder.jl"),
    ("while_loop.jl",       "07_while_loop.jl"),
    ("for_loop.jl",         "08_for_loop.jl"),
    ("cartesian.jl",        "09_cartesian.jl"),
    ("function_call.jl",    "10_function_call.jl"),
    ("result.jl",           "11_result.jl"),
    ("scope.jl",            "12_scope.jl"),
    ("let_scope.jl",        "13_let_scope.jl"),
    ("array.jl",            "14_array.jl"),
    ("tuple.jl",            "15_tuple.jl"),
    ("dictionary.jl",       "16_dictionary.jl"),
    ("type_tree.jl",        "17_type_tree.jl"),
    ("composite_type.jl",   "18_composite_type.jl"),
    ("parametric_type.jl",  "19_parametric_type.jl"),
    ("exception.jl",        "20_exception.jl"),
    ("try_sqrt.jl",         "21_try_sqrt.jl"),
]

# Files that repeat another demo (a typo in the name produced a second copy).
# The right-hand side is the post-rename name, so the check works before or
# after the numbering run.
DUPLICATES = [("wile_loop.jl", "07_while_loop.jl")]


def digest(path: Path) -> str:
    """Content fingerprint, whitespace-insensitive.

    The duplicate-pair check exists for files that repeat another demo after a
    typo in the name. Julia does not care about trailing newlines or blank
    lines, so two demos that differ only in whitespace are the same example and
    the shorter-named one is the typo.
    """
    text = path.read_text(encoding="utf-8")
    return hashlib.sha256(" ".join(text.split()).encode("utf-8")).hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--dry-run", action="store_true", help="print the plan, change nothing")
    group.add_argument("--apply", action="store_true", help="perform the renames")
    args = parser.parse_args()

    if not DEMO_DIR.is_dir():
        print(f"ERROR: {DEMO_DIR} does not exist", file=sys.stderr)
        return 1

    problems = 0
    planned = []

    for source, target in RENAMES:
        src = DEMO_DIR / source
        dst = DEMO_DIR / target
        if not src.exists():
            if dst.exists():                     # already renamed: idempotent
                print(f"[SKIP] {source} -> {target} (already numbered)")
                continue
            print(f"[FAIL] missing source: {source}", file=sys.stderr)
            problems += 1
            continue
        if dst.exists():
            print(f"[FAIL] target already exists: {target}", file=sys.stderr)
            problems += 1
            continue
        planned.append((src, dst))
        print(f"[PLAN] {source:22s} -> {target}")

    for dup, original in DUPLICATES:
        dup_path = DEMO_DIR / dup
        orig_path = DEMO_DIR / original
        if not dup_path.exists():
            print(f"[SKIP] {dup} (already removed)")
            continue
        if orig_path.exists() and digest(dup_path) == digest(orig_path):
            print(f"[PLAN] DELETE {dup} (byte-identical duplicate of {original})")
            planned.append((dup_path, None))
        else:
            print(f"[WARN] {dup} differs from {original}: not deleting",
                  file=sys.stderr)

    print(f"\n{len(planned)} change(s) planned, {problems} problem(s)")

    if args.dry_run or problems:
        if problems:
            return 1
        print("dry run: nothing written")
        return 0

    for src, dst in planned:
        if dst is None:
            src.unlink()
        else:
            src.rename(dst)
    print(f"applied {len(planned)} change(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
