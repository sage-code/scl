"""
Retire the legacy ``sage.css`` stylesheet from source HTML pages.

The monolithic ``assets/css/sage.css`` stylesheet was split into focused
modules (``sage-common.css``, ``content-*.css``, ``forms-controls.css``,
``roadmap-*.css``). Pages that still link ``sage.css`` lose their styling
because the file no longer ships.

This script removes every real ``<link>`` tag that references ``sage.css``
from source ``*.html`` files and injects the correct replacement links for
the page type, matching the conventions already used by migrated pages:

- Roadmap topic/lab pages        -> sage-common + content-topic + content-sidebar
- Roadmap track index pages      -> sage-common + sage-hero + roadmap-index
- Auth pages (login/register/..) -> sage-common + forms-controls
- Any other page                 -> sage-common only

Escaped markup inside ``<pre><code>`` blocks (e.g. documentation examples)
is never touched because only real ``<link ...>`` tags are matched.

Usage:
    python scripts/tools/retire_sage_css.py            # apply changes
    python scripts/tools/retire_sage_css.py --dry-run  # report only
"""

import argparse
import os
import re
import sys

# File name -> CSS module injected for each page type (order matters).
TOPIC_CSS = ["sage-common.css", "content-topic.css", "content-sidebar.css"]
INDEX_CSS = ["sage-common.css", "sage-hero.css", "roadmap-index.css"]
AUTH_CSS = ["sage-common.css", "forms-controls.css"]
DEFAULT_CSS = ["sage-common.css"]

AUTH_PAGE_NAMES = {
    "login.html",
    "register.html",
    "profile.html",
    "reset-password.html",
    "unregister.html",
}

SKIP_DIRS = {"public", "node_modules", ".git", "assets", "supabase"}

# Matches a real <link> tag (any attribute order, quotes, optional XHTML
# self-closing slash) whose href points at sage.css in any of the historical
# forms: "/sage.css", "sage.css", "../sage.css", "/assets/css/sage.css".
# Escaped entities like &lt;link ...&gt; never match because the tag must
# start with a literal "<link".
LINK_RE = re.compile(
    r"<link\b[^>]*\bhref\s*=\s*(?P<q>[\"'])(?P<href>[^\"']*sage\.css)(?P=q)[^>]*>",
    re.IGNORECASE,
)


def iter_html_files(root):
    """Yield source HTML file paths, skipping build output and assets."""
    for subdir, dirs, files in os.walk(root):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for file in files:
            if file.endswith(".html"):
                yield os.path.join(subdir, file)


def css_modules_for_page(rel_path):
    """Pick the replacement CSS module set based on the page type."""
    name = os.path.basename(rel_path).lower()
    parts = rel_path.replace("\\", "/").split("/")

    if name in AUTH_PAGE_NAMES:
        return AUTH_CSS, "auth"
    # Roadmap track index: roadmap/<track>/index.html
    if len(parts) >= 3 and parts[0] == "roadmap" and name == "index.html":
        return INDEX_CSS, "index"
    if parts and parts[0] in ("roadmap", "projects", "community"):
        return TOPIC_CSS, "topic"
    return DEFAULT_CSS, "default"


def build_link_block(modules, indent):
    """Render the replacement <link> block with the original indentation."""
    return "\n".join(
        f'{indent}<link rel="stylesheet" href="/assets/css/{module}">'
        for module in modules
    )




def replace_link(match, modules, content, match_start, match_end):
    """Replace one sage.css <link> with the injected block.

    If the tag sits alone on its own line the whole line becomes the block;
    otherwise the tag is swapped in place to keep inline layout intact.
    """
    line_start = content.rfind("\n", 0, match_start) + 1
    line_end = content.find("\n", match_end)
    if line_end == -1:
        line_end = len(content)
    line = content[line_start:line_end]

    if line.strip() == match.group(0).strip():
        indent = line[: len(line) - len(line.lstrip())]
        return build_link_block(modules, indent)
    return "\n".join(
        f'<link rel="stylesheet" href="/assets/css/{module}">' for module in modules
    )


def process_file(path, root, dry_run):
    """Migrate one HTML file. Returns (changed, detail)."""
    with open(path, "r", encoding="utf-8", newline="") as handle:
        content = handle.read()

    matches = list(LINK_RE.finditer(content))
    if not matches:
        return False, "no sage.css link"

    rel_path = os.path.relpath(path, root)
    modules, page_kind = css_modules_for_page(rel_path)
    present = set(re.findall(r"/assets/css/([a-z-]+)\.css", content))
    modules = [m for m in modules if m not in present]

    if not modules:
        # Nothing to inject (page already has every replacement module);
        # just drop the stale sage.css link.
        result = LINK_RE.sub("", content)
        detail = f"removed stale link only ({page_kind})"
    else:
        result = ""
        last_end = 0
        for match in matches:
            result += content[last_end : match.start()]
            result += replace_link(match, modules, content, match.start(), match.end())
            last_end = match.end()
        result += content[last_end:]
        detail = f"{page_kind} -> {', '.join(modules)}"

    if result != content and not dry_run:
        with open(path, "w", encoding="utf-8", newline="") as handle:
            handle.write(result)

    return True, detail


def main():
    parser = argparse.ArgumentParser(
        description="Retire sage.css links from source HTML pages."
    )
    parser.add_argument(
        "--root",
        default=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        help="Repository root (default: script location).",
    )
    parser.add_argument(
        "--dry-run", action="store_true", help="Report changes without writing files."
    )
    args = parser.parse_args()

    root = os.path.abspath(args.root)
    changed = 0
    scanned = 0

    for path in iter_html_files(root):
        scanned += 1
        try:
            was_changed, detail = process_file(path, root, args.dry_run)
        except (OSError, UnicodeDecodeError) as error:
            print(f"ERROR  {os.path.relpath(path, root)}: {error}")
            continue
        if was_changed:
            changed += 1
            prefix = "WOULD FIX" if args.dry_run else "FIXED   "
            print(f"{prefix}  {os.path.relpath(path, root)}: {detail}")

    action = "would be migrated" if args.dry_run else "migrated"
    print(f"\nScanned {scanned} HTML files, {changed} {action}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

