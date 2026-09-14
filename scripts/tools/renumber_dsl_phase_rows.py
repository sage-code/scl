#!/usr/bin/env python3
"""Renumber DSL index topic rows so each phase restarts at 01.

The per-phase scheme makes inserting a topic inside one phase harmless: later
phases keep their numbers. The mapping is keyed on the row's data-topic, not on
the current numeric cell (two rows may hold the same digit during an edit).

Usage: python scripts/tools/renumber_dsl_phase_rows.py [--dry-run]
"""
import argparse
import difflib
import pathlib
import re
import sys

TARGET = pathlib.Path("roadmap/dsl/index.html")

# topic -> new per-phase number
TOPIC_NUM = {
    # phase 1
    "overview-scope": "01",
    "design-considerations": "02",
    "syntax-notation": "03",
    "grammar-rules": "04",
    "parsing-trees": "05",
    "semantics-scoping": "06",
    "types-values": "07",
    "errors-diagnostics": "08",
    # phase 2 - implementation (compiler building)
    "compiler-design": "01",
    "semantic-analysis": "02",
    "intermediate-representations": "03",
    "compilers": "04",
    "interpreters": "05",
    "bytecode": "06",
    "virtual-machines": "07",
    "code-generation": "08",
    "code-optimization": "09",
    # phase 3 - DSL implementation languages
    "antlr": "01",
    "racket": "02",
    "ocaml": "03",
    # phase 4 - execution models
    "forth": "01",
    "fasm": "02",
    "verilog": "03",
    "llvm": "04",
    # phase 5 - AI domain-specific languages
    "triton": "01",
    "mojo": "02",
    "julia": "03",
    # phase 6 - statistics & scientific languages
    "r": "01",
    "matlab": "02",
    "wolfram": "03",
    "stan": "04",
    # phase 7 - logic languages
    "prolog": "01",
    "datalog": "02",
    "clingo": "03",
    "minizinc": "04",
    "lisp": "05",
    "autolisp": "06",
    "clojure": "07",
    # phase 8 - practice & reference
    "references": "01",
}

ROW = re.compile(r"(<tr data-topic=\")([^\"]+)(\">)(.*?)(</tr>)", re.S)
CELL = re.compile(r"<td>(\d\d)</td>")


def renumber(text: str) -> str:
    def rep(match):
        topic = match.group(2)
        if topic not in TOPIC_NUM:
            return match.group(0)
        newnum = TOPIC_NUM[topic]
        body = CELL.sub(lambda cm: "<td>%s</td>" % newnum, match.group(4), count=1)
        return match.group(1) + topic + match.group(3) + body + match.group(5)

    return ROW.sub(rep, text)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    old = TARGET.read_text(encoding="utf-8")
    new = renumber(old)
    if old == new:
        print("[SAME] nothing to renumber")
        return 0
    if args.dry_run:
        diff = difflib.unified_diff(
            old.splitlines(keepends=True),
            new.splitlines(keepends=True),
            fromfile=str(TARGET),
            tofile=str(TARGET) + " (renumbered)",
        )
        sys.stdout.writelines(diff)
        return 0
    TARGET.write_text(new, encoding="utf-8")
    print("[OK] renumbered roadmap/dsl/index.html (per-phase numbering)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
