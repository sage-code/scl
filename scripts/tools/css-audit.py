"""
Audit source HTML pages for missing stylesheet module links.

The legacy monolithic ``assets/css/sage.css`` was split into focused modules
under ``assets/css/``. Pages must link every module whose selectors they use.

How it works:
1. Index every local module (``assets/css/*.css``, skipping retired files)
   mapping each ``.class`` / ``#id`` selector to its owning module(s).
2. For each source ``*.html`` page, collect linked modules and the classes /
   ids present in the markup.
3. A selector is satisfied when ANY of its owning modules is already linked
   (modules may intentionally duplicate shared selectors).
   ``sage-common.css`` is the global base and is always assumed present.
4. A curated per-page-type requirement table (matching the conventions of
   already-migrated pages) is enforced on top of the class detection.

Patching is diff-friendly: files are read and written with their original
newline style and only the missing ``<link>`` lines are inserted right after
the last ``<link>`` tag in ``<head>`` - no reformatting, no whole-file writes.

Usage:
    python scripts/tools/css-audit.py             # report only
    python scripts/tools/css-audit.py --apply     # patch missing links
"""

import argparse
import os
import re
import sys

CSS_DIR = os.path.join("assets", "css")
BASE_MODULE = "sage-common.css"
SKIP_DIRS = {"public", "node_modules", ".git", "assets", "supabase", ".venv"}

# Curated requirements per page type (module file names, without .css).
# Page type -> frozenset of required modules.
AUTH_PAGES = {"login.html", "register.html", "profile.html",
              "reset-password.html", "unregister.html"}
TOPIC_MARKERS = ("TOPIC_CONFIG", "study-sidebar", "topic-loader")
CURATED = {
    "auth": frozenset({"sage-common", "sage-hero", "sage-cards", "forms-controls"}),
    "index": frozenset({"sage-common", "sage-hero", "sage-cards", "roadmap-index"}),
    "topic": frozenset({"sage-common", "content-topic", "content-sidebar"}),
}


def page_type(rel_path, html):
    """Classify a page by its repository path and topic markers."""
    name = os.path.basename(rel_path).lower()
    parts = rel_path.replace("\\", "/").split("/")
    if name in AUTH_PAGES:
        return "auth"
    if len(parts) >= 3 and parts[0] == "roadmap" and name == "index.html":
        return "index"
    if (parts and parts[0] in ("roadmap", "projects", "community")
            and any(marker in html for marker in TOPIC_MARKERS)):
        return "topic"
    return None



def build_index(css_dir):
    """Map selector name (with . or # prefix) -> set of module names."""
    index = {}
    for fn in sorted(os.listdir(css_dir)):
        if not fn.endswith(".css") or "old" in fn or fn.endswith(".bak"):
            continue
        with open(os.path.join(css_dir, fn), encoding="utf-8", errors="replace") as fh:
            src = fh.read()
        src = re.sub(r"/\*.*?\*/", "", src, flags=re.S)  # strip comments
        for match in re.finditer(r"([.#])[-_A-Za-z][-_A-Za-z0-9]*", src):
            index.setdefault(match.group(0), set()).add(fn[:-4])
    return index


def used_selectors(html):
    """Collect class names and ids present in the page markup."""
    names = set()
    for match in re.finditer(r'class="([^"]+)"', html):
        names.update(match.group(1).split())
    for match in re.finditer(r"class='([^']+)'", html):
        names.update(match.group(1).split())
    names.update("#" + i for i in re.findall(r'id="([a-zA-Z0-9_-]+)"', html))
    return names


def linked_modules(html):
    return set(re.findall(r"/assets/css/([a-z.-]+)\.css", html))


def missing_modules(html, rel_path, index):
    """Return (missing, evidence) for one page."""
    linked = linked_modules(html)
    required = set(CURATED.get(page_type(rel_path, html), ()))
    evidence = {}
    base = BASE_MODULE[:-4]
    for name in used_selectors(html):
        owners = index.get(name)
        if not owners:
            continue  # Bootstrap or unknown class - not our concern
        if owners & linked:
            continue  # satisfied by an already linked module
        if owners <= {base}:
            continue  # only the global base defines it
        for owner in owners - {base}:
            evidence.setdefault(owner, []).append(name)
        required.update(owners - {base})
    missing = sorted(m for m in required - linked if m != base)
    return missing, evidence



def inject_links(html, modules):
    """Insert missing <link> lines after the last stylesheet link in <head>.

    Byte-preserving: only the inserted region changes; the anchor line's
    indentation and the file's newline style are respected so git diff shows
    the added lines only.
    """
    head_end = html.find("</head>")
    if head_end == -1:
        return html, False
    head = html[:head_end]
    # Anchor on the last stylesheet <link> tag inside <head>.
    anchor = None
    for match in re.finditer(r"<link\b[^>]*>", head):
        if re.search(r"rel\s*=\s*[\"']stylesheet[\"']", match.group(0), re.I):
            anchor = match
    if anchor is None:
        return html, False
    line_start = head.rfind("\n", 0, anchor.start()) + 1
    line_end = head.find("\n", anchor.end())
    if line_end == -1:
        line_end = head_end
    line = head[line_start:line_end]
    indent = line[: len(line) - len(line.lstrip())]
    newline = "\r\n" if "\r\n" in html[:head_end] else "\n"
    # Do not swallow the anchor line's carriage return (CRLF files).
    cut = line_end
    if cut > line_start and html[cut - 1] == "\r":
        cut -= 1
    lines = "".join(
        f"{newline}{indent}<link rel=\"stylesheet\" href=\"/assets/css/{module}.css\">"
        for module in modules
    )
    patched = html[:cut] + lines + html[cut:]
    return patched, True


def iter_html_files(root):
    for subdir, dirs, files in os.walk(root):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for file in files:
            if file.endswith(".html"):
                yield os.path.join(subdir, file)


def main():
    parser = argparse.ArgumentParser(
        description="Audit and patch missing CSS module links in source pages."
    )
    parser.add_argument(
        "--root",
        default=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        help="Repository root (default: script location).",
    )
    parser.add_argument(
        "--apply", action="store_true", help="Patch files, not just report."
    )
    args = parser.parse_args()

    root = os.path.abspath(args.root)
    index = build_index(os.path.join(root, CSS_DIR))
    flagged = patched = 0

    for path in iter_html_files(root):
        rel = os.path.relpath(path, root)
        with open(path, "r", encoding="utf-8", newline="") as fh:
            html = fh.read()
        missing, evidence = missing_modules(html, rel, index)
        if not missing:
            continue
        flagged += 1
        details = "; ".join(f"{m} <- {evidence.get(m, ['curated'])[:3]}" for m in missing)
        if args.apply:
            html, ok = inject_links(html, missing)
            if ok:
                with open(path, "w", encoding="utf-8", newline="") as fh:
                    fh.write(html)
                patched += 1
                print(f"PATCHED {rel}: +{', +'.join(missing)}")
            else:
                print(f"FAILED  {rel}: no <head>/<link> anchor found")
        else:
            print(f"MISSING {rel}: {', '.join(missing)} ({details})")

    mode = "patched" if args.apply else "flagged"
    print(f"\n{flagged} file(s) {mode} (index: {len(index)} selectors).")
    return 0


if __name__ == "__main__":
    sys.exit(main())

