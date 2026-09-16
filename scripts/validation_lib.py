#!/usr/bin/env python3
"""Shared helpers for the source/public validation engines.

Used by:
- scripts/test/test_sources.py  (`npm run test`  — verify source files)
- scripts/check_public.py       (`npm run check` — verify generated public/)
"""
from __future__ import annotations

import bisect
import html.entities as html_mod
import json
import re
from html.parser import HTMLParser
from pathlib import Path

H1_RE = re.compile(r"<h1\b", re.IGNORECASE)
H2_RE = re.compile(r"<h2\b", re.IGNORECASE)

# Marker on a LEGACY title node — the un-migrated sidebar shape where the page title
# is a childless leaf sitting above flat `<h2>` chapters. The single-root folder model
# needs no marker: the title IS the only top-level entry and it carries its chapters in
# `children`, so nothing has to be tagged. Kept so the validators can still recognise
# (and flag) the old shape. Mirrored in scripts/tools/gen_topic_sidebars.py, the tool
# that migrates a page out of it.
TITLE_ROLE = "title"


def read_text(path: Path) -> str:
    """Read a file leniently; encoding issues surface as content checks, not crashes."""
    return path.read_text(encoding="utf-8", errors="ignore")


def validate_json_syntax(text: str):
    """Parse JSON text. Returns (error, data); error is None on success."""
    try:
        return None, json.loads(text)
    except json.JSONDecodeError as e:
        return f"Invalid JSON: {e}", None


def sidebar_issues(data, rel: str) -> list:
    """Validate roadmap sidebar/topic JSON hierarchy.

    Returns (level, message) tuples; level is "fail" or "warn".

    Rule (see manual/ARCHITECTURE.md §"Topic sidebar JSON"): entries are objects;
    each entry may carry a "children" list; nested children are objects with at
    least "link".
    - Structural breakage (non-list children, non-object entries, missing link)
      fails: it breaks tree navigation in assets/js/topic-loader.js.
    - Missing "title" only warns: topic-loader.js falls back to a formatted
      section name (item.title || this.formatTopicName(sectionKey)).
    - The page title is the ROOT FOLDER. Canonical (single-root) shape: every
      top-level entry carries "children", the page `<h1>` is the only such entry,
      and its children are the `<h2>` chapters (each owning its `<h3>` anchors).
      title -> chapter -> sub-section is then three collapsible levels in
      topic-loader.js and build.js. No marker key is involved: a node folds because
      it HAS children.
      A page may declare several `<h1>` roots; each opens its own top-level entry.
      Anything else — a legacy childless `"role": "title"` leaf above flat `<h2>`
      chapters, or a sidebar with no title at all — warns as content debt and is
      migrated by regenerating the sidecar from the page
      (scripts/tools/gen_topic_sidebars.py).
    - Any `"role": "title"` entry must anchor with '#': topic-loader.js only renders
      '#'-anchored nodes, so an unanchored title is dead navigation (fails).
    """
    issues: list = []

    if not isinstance(data, list):
        return [("fail", f"{rel}: sidebar JSON must be a list of entries")]

    def walk(entry) -> None:
        if not isinstance(entry, dict):
            issues.append(("fail", f"{rel}: sidebar entry must be an object"))
            return
        if "title" not in entry:
            issues.append(("warn", f"{rel}: sidebar entry missing 'title'"))
        if entry.get("role") == TITLE_ROLE and not str(entry.get("link", "")).startswith("#"):
            issues.append(("fail", f"{rel}: page-title entry needs a '#' anchor link"))
        children = entry.get("children")
        if children is None:
            return
        if not isinstance(children, list):
            issues.append(("fail", f"{rel}: sidebar 'children' must be a list"))
            return
        for child in children:
            if isinstance(child, dict) and "link" not in child:
                issues.append(("fail", f"{rel}: sidebar child missing 'link'"))
            walk(child)

    if data:
        first = data[0]
        single_root = all(
            isinstance(entry, dict) and entry.get("children") is not None for entry in data
        )
        if not single_root:
            # Two things share this fix: a legacy flat sidebar (childless title leaf,
            # or no title at all) and a sidebar whose title never got a root folder.
            # Either way the repair is to regenerate the sidecar from the page, so its
            # `<h1>` becomes the root folder that contains the chapters.
            issues.append(
                (
                    "warn",
                    f"{rel}: sidebar is not a single-root folder — the page title must be "
                    f"the only top-level entry and carry its chapters in 'children'",
                )
            )
        elif first.get("role") == TITLE_ROLE:
            # Root folder that still carries the legacy marker: legal, but the tag adds
            # nothing now that a node folds because it has children.
            issues.append(
                ("warn", f"{rel}: root folder still carries the legacy 'role': '{TITLE_ROLE}' tag")
            )

    for entry in data:
        walk(entry)
    return issues


# --------------------------------------------------------------------------- markup
# Tag-balance and escaping audit for HTML fragments (see also
# scripts/tools/check_html_fragments.py and manual/ARCHITECTURE.md).
#
# WHY THIS IS NOT A REGEX COUNTER: example code inside <pre>/<code> holds "<",
# ">", "&" and "</...>" as LANGUAGE PUNCTUATION (C++ templates, Fortran relational
# operators, shell redirection, a stray "</code>" written in a didactic sample).
# A naive open/close tally reads those as markup and reports failures the browser
# never sees, while missing real breakage. So we first mask the CONTENT of every
# code-bearing element (offsets and newlines preserved), then run a real tokenizer
# over the masked text, then audit escaping separately for code vs prose.
REGION_TAGS = ("pre", "code", "script", "style", "textarea")
# Regions whose content must have "<" and "&" escaped. <script>/<style> are exempt:
# their content is CDATA-ish, `i < n` and `a && b` are not markup there.
ESCAPE_TAGS = frozenset(("pre", "code", "textarea"))
VOID_TAGS = frozenset(
    "area base br col embed hr img input link meta param source track wbr".split()
)
# Element names that may legitimately appear as MARKUP inside a code sample: pages
# highlight examples with `<span class="hljs-keyword">` and use `<sup>` for exponents.
# A `<` that starts one of these, with its closer present in the same region, is
# markup; anything else inside a sample is a symbol that must have been escaped.
_KNOWN_HTML_ELEMENTS = frozenset(
    """
    a abbr address area article aside audio b base bdi bdo blockquote body br button
    canvas caption cite code col colgroup data datalist dd del details dfn dialog div
    dl dt em embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head
    header hgroup hr html i iframe img input ins kbd label legend li link main map
    mark menu meta meter nav noscript object ol optgroup option output p param picture
    pre progress q rp rt ruby s samp script section select slot small source span
    strong style sub summary sup table tbody td template textarea tfoot th thead time
    title tr track u ul var video wbr
    circle clipPath defs ellipse g line linearGradient marker math path polygon
    polyline rect stop svg symbol text tspan use
    """.lower().split()
)
# Elements the HTML parser auto-closes. Unclosed/crossed occurrences of these are
# warnings (browsers recover silently), never failures.
IMPLICIT_END_TAGS = frozenset(
    "li p td th tr option dt dd tbody thead tfoot optgroup rt rp colgroup caption "
    "head body html".split()
)
_TOKEN_RE = re.compile(
    r"<(?P<slash>/?)(?P<tag>%s)\b[^<>]*>" % "|".join(REGION_TAGS), re.IGNORECASE
)
_COMMENT_RE = re.compile(r"<!--.*?-->", re.DOTALL)
# Only a REAL markup start may open a tag span: `<` followed by a letter, `/`, `!`
# or `?`. This keeps `a < b` in a code sample from pairing with a later `>` and
# being mistaken for an attribute-bearing tag during the escaping audit.
_MARKUP_RE = re.compile(r"<[A-Za-z/!?][^<>]*>")
# A "<" the tokenizer will treat as a tag start (rather than as literal text, which
# is what "< " or "<=" remains). Used to find unescaped symbols inside code samples.
_MARKUP_START_RE = re.compile(r"<(?=[A-Za-z/!?])")
# A "&" that opens something entity-shaped: "&amp", "&amp;", "&#160", "&#x".
_ENTITY_START_RE = re.compile(r"&(?:#(?:[xX][0-9A-Fa-f]*)?|[A-Za-z][A-Za-z0-9]{0,31})")
_KNOWN_ENTITY_NAMES = {
    name[:-1] for name in html_mod.html5 if name.endswith(";") and len(name) > 2
}
# Named references HTML5 still resolves WITHOUT the semicolon ("&amp" alone is legal
# text, "&hellip" alone is a parse error). Missing ';' here warns; anywhere else it fails.
_LEGACY_BARE_ENTITIES = frozenset(
    "amp lt gt quot apos nbsp copy reg trade hellip mdash ndash times divide deg "
    "plusmn frac12 frac14 frac34 sup1 sup2 sup3 laquo raquo middot".split()
)


class _LineIndex:
    """Byte-offset -> (line, column) conversion for precise messages."""

    def __init__(self, text: str) -> None:
        self.starts = [0]
        for i, ch in enumerate(text):
            if ch == "\n":
                self.starts.append(i + 1)

    def pos(self, offset: int) -> tuple[int, int]:
        line = bisect.bisect_right(self.starts, offset) - 1
        return line + 1, offset - self.starts[line] + 1


class _RegionSpans:
    """Sorted, nestable intervals with an O(log n) containment test."""

    def __init__(self, spans: list[tuple[int, int]]) -> None:
        self.spans = sorted(spans)
        self.starts: list[int] = []
        self.max_end: list[int] = []
        for start, end in self.spans:
            self.starts.append(start)
            self.max_end.append(max(end, self.max_end[-1] if self.max_end else end))

    def contains(self, offset: int) -> bool:
        index = bisect.bisect_right(self.starts, offset) - 1
        return index >= 0 and self.max_end[index] > offset

    def enclosing(self, offset: int) -> tuple[int, int] | None:
        """The innermost interval containing `offset`, or None."""
        if not self.contains(offset):
            return None
        best: tuple[int, int] | None = None
        for start, end in self.spans:
            if start > offset:
                break
            if start <= offset < end and (best is None or end - start < best[1] - best[0]):
                best = (start, end)
        return best


# Inline elements a page may wrap around sample text purely for presentation
# (`<sup>2</sup>` for an exponent). Together with an attribute-bearing tag and the
# void set, these are what earns a `<` inside a sample the benefit of the doubt.
_HIGHLIGHT_ELEMENTS = frozenset(
    "span sup sub b i em strong code kbd samp var mark small".split()
)


def _is_markup_at(text: str, offset: int, limit: int) -> bool:
    """True when the '<' at `offset` opens real markup rather than a symbol.

    Inside a code sample, `<span class="hljs-keyword">` and `<sup>2</sup>` are how
    pages highlight examples, while `if (i<n)` and `vector<int>` are symbols whose
    '<' must have been escaped. The test is deliberately narrow — a known element
    name AND either an attribute, a presentation element, or a void element AND its
    closer present inside the same region — so a sample that merely SHOWS tags
    (`<div>hello</div>`) is still reported instead of being silently excused.
    """
    match = re.match(r"</?([A-Za-z][A-Za-z0-9-]*)", text[offset:])
    if match is None:
        return False
    name = match.group(1).lower()
    if name not in _KNOWN_HTML_ELEMENTS:
        return False
    token = re.match(r"<[^<>]*>", text[offset:])
    if token is None:
        return False  # "<span" with no ">" at all is a broken sample, not markup
    has_attribute = "=" in token.group(0) or " " in token.group(0)[:-1].strip()
    if not (has_attribute or name in VOID_TAGS or name in _HIGHLIGHT_ELEMENTS):
        return False
    if name in VOID_TAGS:
        return True
    return re.search(r"</%s[\s>]" % name, text[offset:limit], re.IGNORECASE) is not None


def _mask_regions(
    text: str, lines: _LineIndex
) -> tuple[
    str,
    list[tuple[str, str]],
    list[tuple[int, int]],
    list[tuple[int, int]],
    list[tuple[int, int]],
]:
    """Blank the content of code-bearing elements, keeping every other byte in place.

    Returns (masked_text, notes, escape_spans, keeps) where notes are
    (level, message) tuples, escape_spans are the interiors of
    <pre>/<code>/<textarea> — the places where "<" and "&" must have been written as
    entities — and keeps are the spans of REAL markup (a nested `<code>` inside a
    `<pre>`), which stay visible to the tokenizer and are never mistaken for an
    unescaped symbol.

    The walk mirrors a browser tokenizer rather than a counter: a closing tag that
    matches the innermost open region closes it; one that matches an OUTER region
    implies the inner ones close first (reported as a warning); anything else is
    content — which is exactly why a didactic sample containing a literal
    `</code>` or a Fortran slice like `y(2:size(y) - 1)` is not structure.
    Content is then blanked (newlines preserved, so line numbers stay exact) while
    real markup spans are restored, leaving the tokenizer a clean document.
    """
    notes: list[tuple[str, str]] = []
    pending: list[tuple[str, re.Match]] = []
    pairs: list[tuple[str, re.Match, re.Match | None]] = []
    keeps: list[tuple[int, int]] = []
    comments = [match.span() for match in _COMMENT_RE.finditer(text)]

    def keep(match: re.Match) -> None:
        keeps.append((match.start(), match.end()))

    for token in _TOKEN_RE.finditer(text):
        if any(start <= token.start() < end for start, end in comments):
            continue  # markup inside a comment is not markup
        tag = token.group("tag").lower()
        if not token.group("slash"):
            pending.append((tag, token))
            continue
        names = [name for name, _ in pending]
        if not names:
            line, col = lines.pos(token.start())
            notes.append(("fail", f"{line}:{col}: </{tag}> closes nothing"))
            continue
        if names[-1] != tag:
            if tag not in names:
                line, col = lines.pos(token.start())
                notes.append(
                    (
                        "warn",
                        f"{line}:{col}: literal <{tag}> inside a code sample - the "
                        f"browser closes the block there and drops the rest of it",
                    )
                )
                continue
            line, col = lines.pos(token.start())
            while names[-1] != tag:  # crossed nesting: inner regions close first
                inner_tag, inner_open = pending.pop()
                pairs.append((inner_tag, inner_open, None))
                keep(inner_open)
                notes.append(
                    ("warn", f"{line}:{col}: <{inner_tag}> implicitly closed by </{tag}>")
                )
                names.pop()
        open_tag, open_match = pending.pop()
        pairs.append((open_tag, open_match, token))
        keep(open_match)
        keep(token)

    for tag, open_match in pending:
        line, col = lines.pos(open_match.start())
        hint = (
            " (unescaped '<'? a bogus <tag> inside a code sample swallows the closer)"
            if tag in ESCAPE_TAGS
            else ""
        )
        notes.append(("fail", f"{line}:{col}: <{tag}> is never closed{hint}"))
        pairs.append((tag, open_match, None))
        keep(open_match)

    buffer = list(text)

    def blank(start: int, end: int) -> None:
        for index in range(max(start, 0), min(end, len(buffer))):
            if buffer[index] != "\n":
                buffer[index] = " "

    for start, end in comments:
        blank(start, end)
    for _tag, open_match, close_match in pairs:
        blank(open_match.end(), close_match.start() if close_match else len(text))
    for start, end in keeps:
        buffer[start:end] = text[start:end]

    escape_spans = [
        (open_match.end(), close_match.start() if close_match else len(text))
        for tag, open_match, close_match in pairs
        if tag in ESCAPE_TAGS
    ]
    # Regions with no closer swallow the rest of the document in a browser. Every
    # later "<" would then be reported as an unescaped symbol in code, which buries
    # the single finding that matters, so those interiors are excluded from that
    # audit (the missing closer is already reported above).
    unclosed_spans = [
        (open_match.end(), len(text))
        for tag, open_match, close_match in pairs
        if close_match is None and tag in ESCAPE_TAGS
    ]
    return "".join(buffer), notes, escape_spans, keeps, unclosed_spans




def _excerpt(text: str, offset: int, width: int = 14) -> str:
    """A console-safe one-line snippet of the source at `offset`.

    Messages are printed to terminals whose encoding is not guaranteed (Windows
    cp1252 raises on the first non-ASCII byte), so a snippet quoted from authored
    content is reduced to printable ASCII here rather than at the call site.
    """
    snippet = text[offset : offset + width].split("\n")[0]
    return "".join(ch if 32 <= ord(ch) < 127 else "?" for ch in snippet)


class _BalanceParser(HTMLParser):
    """Tokenize the MASKED document and report structural breakage.

    Region tags are skipped: their balance is owned by `_mask_regions`, which can
    tell a real closer from a literal one written inside a sample. Everything else
    is pushed and popped, with the HTML parser's own recovery rules applied —
    unclosed `<li>`/`<p>`/`<td>` is a warning (a browser closes it silently), a
    crossed pair is a failure (a browser nests it, changing the layout).
    """

    def __init__(self, issues: list[tuple[str, str]]) -> None:
        super().__init__(convert_charrefs=True)
        self.issues = issues
        self.stack: list[tuple[str, tuple[int, int]]] = []

    def handle_starttag(self, tag: str, attrs) -> None:
        if tag not in VOID_TAGS and tag not in REGION_TAGS:
            self.stack.append((tag, self.getpos()))

    def handle_startendtag(self, tag: str, attrs) -> None:
        return  # self-closed: already balanced

    def handle_endtag(self, tag: str) -> None:
        if tag in REGION_TAGS:
            return
        names = [name for name, _ in self.stack]
        if tag not in names:
            line, col = self.getpos()
            self.issues.append(("fail", f"{line}:{col}: </{tag}> closes nothing"))
            return
        line, col = self.getpos()
        while names[-1] != tag:
            inner_tag, inner_pos = self.stack.pop()
            names.pop()
            level = "warn" if inner_tag in IMPLICIT_END_TAGS else "fail"
            self.issues.append(
                (
                    level,
                    f"{line}:{col}: </{tag}> closes <{inner_tag}> opened at "
                    f"line {inner_pos[0]}",
                )
            )
        self.stack.pop()

    def finish(self) -> None:
        for tag, (line, col) in self.stack:
            level = "warn" if tag in IMPLICIT_END_TAGS else "fail"
            self.issues.append((level, f"{line}:{col}: <{tag}> is never closed"))


def _audit_escaping(
    text: str,
    masked: str,
    keeps: list[tuple[int, int]],
    escape_spans: list[tuple[int, int]],
    unclosed_spans: list[tuple[int, int]],
    lines: _LineIndex,
    issues: list[tuple[str, str]],
) -> None:
    """Report '<' and '&' that the browser will consume as markup or as an entity.

    Two passes, because masking hides exactly the case worth catching:
    1. UNESCAPED SYMBOLS IN CODE — scanned on the ORIGINAL text inside
       <pre>/<code>/<textarea>, skipping real markup, so `if (i<n)` or
       `std::vector<int>` is reported instead of silently vanishing into the
       masked content. Interiors of unclosed regions are skipped: everything after
       such a region only looks like code because the closer is missing.
    2. ENTITIES — scanned on the MASKED text, where a correctly written `&lt;` is
       still the four source characters, never a decoded '<'.
    """
    code_spans = _RegionSpans(escape_spans)
    keep_spans = _RegionSpans(keeps)
    unclosed_spans_pool = _RegionSpans(unclosed_spans)
    comment_spans = _RegionSpans([match.span() for match in _COMMENT_RE.finditer(text)])
    tag_spans = _RegionSpans([match.span() for match in _MARKUP_RE.finditer(masked)])

    for match in _MARKUP_START_RE.finditer(text):
        offset = match.start()
        region = code_spans.enclosing(offset)
        if region is None or keep_spans.contains(offset) or comment_spans.contains(offset):
            continue  # prose symbols are owned by the tokenizer pass; markup is fine
        if unclosed_spans_pool.contains(offset):
            continue  # collateral of an unclosed region, reported separately
        if _is_markup_at(text, offset, region[1]):
            continue  # real markup inside the sample (highlight spans, <sup>)
        line, col = lines.pos(offset)
        issues.append(
            (
                "fail",
                f"{line}:{col}: unescaped '<' inside a code sample - the browser reads "
                f"'{_excerpt(text, offset)}' as a tag; write &lt; and &gt; instead",
            )
        )

    for amp in re.finditer("&", masked):
        start = amp.start()
        if tag_spans.contains(start):
            continue  # inside a real tag: attribute values are not prose
        match = _ENTITY_START_RE.match(masked, start)
        if match is None:
            # "& " / "&," is unambiguous literal text — HTML5 requires no escaping
            # there, and flagging every page title would drown the real findings.
            continue
        line, col = lines.pos(start)
        in_code = code_spans.contains(start)
        end = match.end()
        body = masked[start + 1 : end]
        if body.startswith("#"):
            # Greedily take the digits: "&#160" must report the whole reference.
            while end < len(masked) and masked[end] in "0123456789abcdefABCDEF":
                body += masked[end]
                end += 1
            terminated = masked[end : end + 1] == ";"
            if terminated and re.fullmatch(r"#\d+|#[xX][0-9A-Fa-f]+", body):
                continue
            suffix = ";" if terminated else ""
            issues.append(
                (
                    "fail",
                    f"{line}:{col}: malformed numeric reference &{body}{suffix} - "
                    f"write &{body}; or literal text",
                )
            )
            continue
        terminated = masked[end : end + 1] == ";"
        if body in _KNOWN_ENTITY_NAMES:
            if terminated:
                continue
            level = "warn" if body in _LEGACY_BARE_ENTITIES else "fail"
            issues.append(
                (
                    level,
                    f"{line}:{col}: &{body} is missing its closing ';' - write &{body};",
                )
            )
            continue
        if terminated:
            level = "warn" if in_code else "fail"
            issues.append(
                (level, f"{line}:{col}: unknown entity &{body}; - it renders literally")
            )
            continue
        if not in_code:
            issues.append(
                (
                    "warn",
                    f"{line}:{col}: bare '&' in prose followed by '{body}' - "
                    f"write &amp; if you meant an ampersand",
                )
            )


def html_markup_issues(text: str, rel: str = "") -> list[tuple[str, str]]:
    """Audit one HTML fragment or page: tag balance plus escaping.

    Returns (level, message) tuples with level "fail" or "warn"; `message` carries
    a `line:col` prefix so it can be pasted straight into an editor go-to-line.
    False-positive sources are deliberately neutralised: code samples may contain
    '<', '>', '&' and even a literal closing tag, comments are ignored, and
    elements a browser auto-closes never fail.
    """
    lines = _LineIndex(text)
    masked, issues, escape_spans, keeps, unclosed_spans = _mask_regions(text, lines)
    parser = _BalanceParser(issues)
    parser.feed(masked)
    parser.close()
    parser.finish()
    _audit_escaping(text, masked, keeps, escape_spans, unclosed_spans, lines, issues)
    prefix = f"{rel}: " if rel else ""
    return [(level, prefix + message) for level, message in issues]




