#!/usr/bin/env python3
"""Deterministic refactor: update /roadmap/ URLs and roadmap/ folder paths to roadmaps/.

Dry-run by default (prints summary and sample diffs). Pass --apply to write changes.
Never touches /api/roadmap/, DB table names, CSS/JS filenames, or localStorage keys.
"""
from __future__ import annotations

import argparse
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

TEXT_EXTS = {".html", ".json", ".js", ".css", ".svg", ".md", ".xml", ".txt", ".py"}

URL_ROOTS = [
    "roadmaps",
    "projects",
    "community",
    "assets/js",
]

SINGLE_FILES = [
    "assets/roadmap_template.html",
    "api/_lib/community.js",
    "api/_lib/quiz.js",
    "api/auth/[action].js",
    "sitemap.xml",
    "sitemap_exclude.txt",
    "scripts/tools/sitemap.py",
    "scripts/tools/check_sidebar_render.js",
    "scripts/tools/check_html_fragments.py",
    "scripts/tools/check_sidebar_anchors.py",
    "scripts/tools/audit_common_footer.py",
    "scripts/tools/css-audit.py",
    "scripts/tools/migrate_sidebars.py",
    "scripts/tools/find_missing_sidebars.py",
    "scripts/tools/compose_topic_pages.py",
    "scripts/tools/retire_sage_css.py",
    "tests/test_validation_lib.py",
]

DOC_FILES = [
    "GEMINI.md",
    "README.md",
    "manual/ARCHITECTURE.md",
    ".agents/skills/scl-architecture/SKILL.md",
    ".agents/skills/scl-author-topic/SKILL.md",
    ".agents/skills/scl-build-validate/SKILL.md",
    ".agents/skills/scl-plan-execute/SKILL.md",
]

# Rules applied to content/code files (safe: never touches /api/roadmap/)
URL_RULES = [
    (re.compile(r"(?<!/api)/roadmap/"), "/roadmaps/"),
    (re.compile(r"%2Froadmap%2F"), "%2Froadmaps%2F"),
    (re.compile(r"\.\./\.\./roadmap/"), "../../roadmaps/"),
    (re.compile(r"\^\\/roadmap\\/"), r"^\/roadmaps\/"),
]

# Extra path rules for specific tool scripts
TOOL_PATH_RULES = [
    (re.compile(r'(["\'])roadmap\1'), r'\1roadmaps\1'),
    (re.compile(r"(?<!/api)(?<![A-Za-z0-9_/-])roadmap/"), "roadmaps/"),
]

# Doc rules
DOC_RULES = [
    (re.compile(r"(?<!/api)/roadmap/"), "/roadmaps/"),
    (re.compile(r"(?<!/api)(?<![A-Za-z0-9_/-])roadmap/"), "roadmaps/"),
]

TOOL_PATH_FILES = {
    "scripts/tools/check_html_fragments.py",
    "scripts/tools/check_sidebar_anchors.py",
    "scripts/tools/audit_common_footer.py",
    "scripts/tools/css-audit.py",
    "scripts/tools/migrate_sidebars.py",
    "scripts/tools/find_missing_sidebars.py",
    "scripts/tools/compose_topic_pages.py",
    "scripts/tools/retire_sage_css.py",
    "tests/test_validation_lib.py",
}


def collect_files() -> list[tuple[Path, str]]:
    seen: set[Path] = set()
    items: list[tuple[Path, str]] = []

    for rel_dir in URL_ROOTS:
        d = ROOT / rel_dir
        if not d.exists():
            continue
        for p in sorted(d.rglob("*")):
            if p.is_file() and p.suffix.lower() in TEXT_EXTS and p not in seen:
                seen.add(p)
                items.append((p, "url"))

    for rel in SINGLE_FILES:
        p = ROOT / rel
        if p.is_file() and p not in seen:
            seen.add(p)
            mode = "tool" if rel in TOOL_PATH_FILES else "url"
            items.append((p, mode))

    for rel in DOC_FILES:
        p = ROOT / rel
        if p.is_file() and p not in seen:
            seen.add(p)
            items.append((p, "doc"))

    return items


def transform(text: str, mode: str) -> str:
    rules = URL_RULES if mode == "url" else (URL_RULES + TOOL_PATH_RULES if mode == "tool" else DOC_RULES)
    out = text
    for pat, repl in rules:
        out = pat.sub(repl, out)
    return out


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="Write changes to disk")
    args = parser.parse_args()

    changed = 0
    total_repls = 0
    by_top: dict[str, int] = {}

    for path, mode in collect_files():
        rel = path.relative_to(ROOT).as_posix()
        try:
            original = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        updated = transform(original, mode)
        if updated != original:
            changed += 1
            top = rel.split("/")[0]
            by_top[top] = by_top.get(top, 0) + 1
            if args.apply:
                path.write_text(updated, encoding="utf-8")

    verb = "Updated" if args.apply else "Would update"
    print(f"{verb} {changed} file(s):")
    for k, v in sorted(by_top.items(), key=lambda kv: -kv[1]):
        print(f"  {k}: {v}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
