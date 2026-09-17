#!/usr/bin/env python3
"""Generate the HTML track's SVG diagrams (roadmap/html/img/*.svg).

Deterministic generator — creates NEW files only (never overwrites
existing tracked SVGs unless --force). Style follows
manual/ARCHITECTURE.md §Diagrams (dark-theme spec): solid canvas,
solid boxes, light-on-dark text, labelled arrows, >=12px gaps.

Usage:
  python scripts/tools/gen_html_diagrams.py --dry-run
  python scripts/tools/gen_html_diagrams.py [--force]
"""

import argparse
import os

OUT = os.path.join("roadmap", "html", "img")

# Palette (matches roadmap/elixir/img + roadmap/fortran/img — compliant
# with the manual's dark-theme spec).
CANVAS = "#0d1117"
BORDER = "#30363d"
BOX = "#161b22"
TEXT = "#e6edf3"
MUTED = "#9fb3c8"
FAINT = "#8b949e"
ACCENTS = {"blue": "#58a6ff", "green": "#7ee787", "orange": "#ffa657", "red": "#ff7b72", "purple": "#d2a8ff"}
MONO = "Consolas, monospace"
SANS = "Segoe UI, Arial, sans-serif"


def header(title, subtitle, width=920, height=380):
    return (
        f'<?xml version="1.0" encoding="UTF-8"?>\n'
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" '
        f'viewBox="0 0 {width} {height}" role="img">\n'
        f"  <title>{esc(title)}</title>\n"
        f"  <desc>{esc(subtitle)}</desc>\n\n"
        f'  <rect x="0" y="0" width="{width}" height="{height}" fill="{CANVAS}"/>\n'
        f'  <rect x="12" y="12" width="{width - 24}" height="{height - 24}" fill="none" stroke="{BORDER}" stroke-width="2" rx="10"/>\n'
    )


def footer():
    return "</svg>\n"


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def text(x, y, content, size=15, fill=TEXT, mono=False, weight=None, anchor=None):
    extra = f' font-weight="{weight}"' if weight else ""
    anch = f' text-anchor="{anchor}"' if anchor else ""
    font = MONO if mono else SANS
    return f'  <text x="{x}" y="{y}" font-family="{font}" font-size="{size}" fill="{fill}"{extra}{anch}>{esc(content)}</text>\n'


def code(x, y, content, size=14, fill=None):
    """Monospace inline code text (used inside/next to boxes)."""
    return text(x, y, content, size, fill or MUTED, mono=True)


def box(x, y, w, h, label, sub=None, accent="blue", fill=BOX, text_fill=None):
    stroke = ACCENTS[accent]
    body = f'  <rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}" stroke="{stroke}" stroke-width="2" rx="6"/>\n'
    body += text(x + 16, y + 30, label, 15, text_fill or stroke, mono=True)
    if sub:
        body += text(x + 16, y + 52, sub, 12, MUTED)
    return body


def tagbox(x, y, w, h, open_tag, content, close_tag, accent="blue", sub=None):
    """Container element: opening tag, content, closing tag on one band."""
    stroke = ACCENTS[accent]
    body = f'  <rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{BOX}" stroke="{stroke}" stroke-width="2" rx="6"/>\n'
    body += code(x + 16, y + 30, open_tag, 15, stroke)
    body += text(x + 130, y + 30, content, 15, TEXT)
    body += code(x + w - 118, y + 30, close_tag, 15, stroke)
    if sub:
        body += text(x + 16, y + 52, sub, 12, MUTED)
    return body


def arrow(x1, y1, x2, y2, accent="green", label=None):
    stroke = ACCENTS[accent]
    mid = (x1 + x2) / 2
    body = f'  <line x1="{x1}" y1="{y1}" x2="{x2 - 8}" y2="{y2}" stroke="{stroke}" stroke-width="2"/>\n'
    body += f'  <polygon points="{x2},{y2} {x2 - 9},{y2 - 4} {x2 - 9},{y2 + 4}" fill="{stroke}"/>\n'
    if label:
        body += text(mid, y1 - 8, label, 12, MUTED, anchor="middle")
    return body


def line(x1, y1, x2, y2, accent="green", dashed=False):
    stroke = ACCENTS[accent]
    dash = ' stroke-dasharray="6 4"' if dashed else ""
    return f'  <line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{stroke}" stroke-width="2"{dash}/>\n'


def diamond(cx, cy, w, h, label, accent="orange"):
    """Decision diamond centered on (cx, cy)."""
    stroke = ACCENTS[accent]
    pts = f"{cx},{cy - h / 2} {cx + w / 2},{cy} {cx},{cy + h / 2} {cx - w / 2},{cy}"
    body = f'  <polygon points="{pts}" fill="{BOX}" stroke="{stroke}" stroke-width="2"/>\n'
    body += text(cx, cy + 5, label, 13, stroke, mono=True, anchor="middle")
    return body


def note(x, y, content, width=None):
    """Faint takeaway line at the bottom of a diagram."""
    return text(x, y, content, 13, FAINT)


def banner(x, y, w, content, accent="blue"):
    """Light highlight strip for dark text — the one place dark type is allowed."""
    fill = "#e6edf3"
    body = f'  <rect x="{x}" y="{y}" width="{w}" height="34" fill="{fill}" rx="6"/>\n'
    body += text(x + 14, y + 22, content, 14, "#0d1117", mono=True, weight="bold")
    _ = accent
    return body


# ── Phase 1: Foundations ────────────────────────────────────────────

def element_anatomy():
    b = header("HTML element anatomy", "An element is an opening tag, optional attributes, content, and a closing tag. Void elements have no closing tag and no content.")
    b += text(40, 52, "Tags name the meaning; attributes configure it", 23, TEXT, weight="bold")
    b += text(40, 78, "The browser does not show the tags — it uses them to decide what the content IS.", 15, MUTED)
    b += code(60, 140, "<a", 22, ACCENTS["blue"])
    b += code(100, 140, 'href="https://developer.mozilla.org"', 22, ACCENTS["orange"])
    b += code(460, 140, ">", 22, ACCENTS["blue"])
    b += text(490, 140, "MDN Web Docs", 22, TEXT)
    b += code(660, 140, "</a>", 22, ACCENTS["blue"])
    b += line(95, 152, 95, 200, "blue")
    b += line(470, 152, 470, 200, "blue")
    b += text(60, 222, "opening tag", 13, ACCENTS["blue"])
    b += text(340, 222, 'attribute (name="value")', 13, ACCENTS["orange"])
    b += text(540, 222, "text content", 13, TEXT)
    b += text(660, 222, "closing tag", 13, ACCENTS["blue"])
    b += tagbox(60, 260, 360, 64, "<p>", "paragraph", "</p>", "green", "container: holds content between the tags")
    b += tagbox(460, 260, 380, 64, "<img", 'src="bug.png" alt="A ladybug"', "", "orange", "void: no content, no closing tag — ever")
    b += note(60, 356, "Nesting rule: elements close in the reverse order they opened — <p><strong>text</strong></p>, never <p><strong>text</p></strong>.")
    return b + footer()


def document_tree():
    b = header("The document tree", "The browser parses nesting into a tree of nodes: one html root, exactly one head and one body.")
    b += text(40, 52, "Nesting becomes a tree", 23, TEXT, weight="bold")
    b += text(40, 78, "CSS selectors and JavaScript both navigate this same tree — that is why structure choice matters.", 15, MUTED)
    b += box(380, 110, 160, 56, "html", "root node", "purple")
    b += box(180, 200, 160, 56, "head", "metadata", "blue")
    b += box(560, 200, 180, 56, "body", "visible content", "green")
    b += box(60, 290, 150, 56, "title", "tab text", "blue")
    b += box(240, 290, 170, 56, "meta", "charset, viewport", "blue")
    b += box(470, 290, 170, 56, "h1", "page heading", "orange")
    b += box(680, 290, 170, 56, "p", "paragraph", "orange")
    b += arrow(420, 166, 300, 196, "green")
    b += arrow(500, 166, 620, 196, "green")
    b += arrow(220, 256, 140, 286, "blue")
    b += arrow(300, 256, 320, 286, "blue")
    b += arrow(620, 256, 560, 286, "orange")
    b += arrow(680, 256, 760, 286, "orange")
    b += note(60, 356, "Misnested tags produce an unexpected tree — which silently changes what CSS and JavaScript can reach.")
    return b + footer()


def void_vs_container():
    b = header("Container vs void vs boolean attribute", "Three shapes cover almost every element: containers with content, void elements with none, and attributes whose presence is the value.")
    b += text(40, 52, "Three element shapes", 23, TEXT, weight="bold")
    b += text(40, 78, "Learn to classify an element at a glance; each shape has different writing rules.", 15, MUTED)
    b += box(60, 130, 260, 90, "Container", "<p>…</p> <div>…</div>", "green")
    b += box(360, 130, 260, 90, "Void", "<br> <hr> <img> <input>", "orange")
    b += box(660, 130, 220, 90, "Boolean attribute", "<video autoplay>", "purple")
    b += text(60, 250, "has content and a closing tag;", 13, MUTED)
    b += text(60, 270, "the closing tag is not optional", 13, MUTED)
    b += text(360, 250, "cannot hold content — writing", 13, MUTED)
    b += text(360, 270, "<br></br> is invalid HTML", 13, MUTED)
    b += text(660, 250, "present = true, absent = false;", 13, MUTED)
    b += text(660, 270, 'autoplay="autoplay" is redundant', 13, MUTED)
    b += banner(60, 300, 520, '<input type="checkbox" checked>')
    b += note(60, 356, "Self-closing slashes on void elements (<br/>) are allowed but meaningless in HTML5 — plain <br> is idiomatic.")
    return b + footer()


def whitespace_collapse():
    b = header("Whitespace collapsing", "Runs of spaces, tabs, and newlines in source HTML render as one space. Indentation is for readers, not layout.")
    b += text(40, 52, "The browser forgets your formatting", 23, TEXT, weight="bold")
    b += text(40, 78, "Layout is a job for CSS. Source whitespace only carries meaning inside special elements like <pre>.", 15, MUTED)
    b += box(60, 120, 380, 120, "what you write", None, "blue")
    b += code(80, 155, "<p>", 15, ACCENTS["blue"])
    b += text(100, 185, "Hello    spaces", 15, TEXT)
    b += text(100, 215, "and newlines", 15, TEXT)
    b += code(80, 240, "</p>", 15, ACCENTS["blue"])
    b += arrow(470, 180, 520, 180, "green", "renders as")
    b += box(550, 120, 320, 120, "what the user sees", None, "green")
    b += text(570, 185, "Hello spaces and newlines", 16, TEXT)
    b += text(570, 215, "single spaces; breaks ignored", 12, MUTED)
    b += note(60, 300, "Exception: <pre> keeps every space and newline — the right home for code samples and ASCII diagrams.")
    b += note(60, 356, "Wide indentation can therefore never break the page — but it must not replace real layout either.")
    return b + footer()


def document_anatomy():
    b = header("Document anatomy", "Every page has the same four-part skeleton: doctype, html root, head for metadata, body for content.")
    b += text(40, 52, "The four parts every page needs", 23, TEXT, weight="bold")
    b += text(40, 78, "Omit one and the browser fills in the blanks for you — badly: quirks mode, wrong encoding, no favicon.", 15, MUTED)
    b += box(60, 110, 800, 46, "<!DOCTYPE html>", "not an element: switches the parser to standards mode", "purple")
    b += box(60, 170, 800, 180, '<html lang="en">', None, "blue")
    b += box(90, 205, 370, 120, "<head>", "charset · viewport · title · description · CSS links", "orange")
    b += box(490, 205, 340, 120, "<body>", "everything the user sees and interacts with", "green")
    b += text(110, 250, "machines read here:", 13, MUTED)
    b += text(110, 270, "browser tabs, search engines,", 13, MUTED)
    b += text(110, 290, "social cards", 13, MUTED)
    b += text(510, 250, "people experience here:", 13, MUTED)
    b += text(510, 270, "text, images, forms,", 13, MUTED)
    b += text(510, 290, "buttons, media", 13, MUTED)
    b += note(60, 356, "lang on <html> is the highest-value accessibility attribute on the page — screen readers pick a voice from it.")
    return b + footer()


def head_contents():
    b = header("What belongs in <head>", "The head is a machine-facing briefing: identity first, behavior second, and only the resources you need.")
    b += text(40, 52, "Head inventory, in the order to write it", 23, TEXT, weight="bold")
    b += text(40, 78, "Charset must be within the first 1024 bytes — put it first and never think about it again.", 15, MUTED)
    items = [
        ("meta charset", "UTF-8 character encoding — first, always", "blue"),
        ("meta viewport", "responsive scaling on phones", "blue"),
        ("title", "tab text, bookmark label, top SEO signal", "green"),
        ("meta description", "search-result snippet (not a ranking factor)", "green"),
        ("link rel=stylesheet", "CSS — render-blocking, so keep it small", "orange"),
        ("script defer", "JS — defer keeps HTML parsing uninterrupted", "red"),
    ]
    y = 110
    for label, desc, accent in items:
        b += box(60, y, 230, 40, label, None, accent)
        b += text(320, y + 26, desc, 14, MUTED)
        y += 44
    b += note(60, 356, "Favicon, canonical, and social tags also live here — the metadata chapter covers the full SEO and social set.")
    return b + footer()


def parse_render_flow():
    b = header("From bytes to pixels", "The parser turns bytes into tokens, tokens into the DOM; CSS builds the CSSOM; the render tree is painted to the screen.")
    b += text(40, 52, "Why blocking resources freeze the page", 23, TEXT, weight="bold")
    b += text(40, 78, "HTML parsing stops at a blocking stylesheet or script — every performance trick works on this pipeline.", 15, MUTED)
    stages = [
        (60, "bytes", "network response", "blue"),
        (270, "tokens", "parser sees < and >", "green"),
        (480, "DOM", "the element tree", "orange"),
        (690, "render", "paint to screen", "purple"),
    ]
    for x, name, sub, accent in stages:
        b += box(x, 130, 170, 70, name, sub, accent)
    for i in range(len(stages) - 1):
        b += arrow(stages[i][0] + 176, 165, stages[i][0] + 206, 165, "green")
    b += box(480, 240, 170, 60, "CSSOM", "from stylesheets", "red")
    b += arrow(565, 200, 565, 236, "red")
    b += arrow(650, 266, 730, 210, "red", "render tree = DOM x CSSOM")
    b += text(60, 240, "blocking <script>", 13, ACCENTS["red"])
    b += text(60, 260, "pauses the token stage", 13, ACCENTS["red"])
    b += note(60, 356, "One blocking script in <head> delays every pixel after it — defer/async move scripts off this critical path.")
    return b + footer()


def heading_scale():
    b = header("The heading scale", "Six heading levels form an outline, like a book's table of contents. Level by position, not by font size.")
    b += text(40, 52, "h1 is the page title, h2 its chapters", 23, TEXT, weight="bold")
    b += text(40, 78, "Never choose a heading for its size — that is CSS. Assistive technology navigates by this outline.", 15, MUTED)
    rows = [
        (110, "h1", "one per page: the subject of the whole document", 26, "blue"),
        (160, "h2", "major sections, in document order", 21, "green"),
        (205, "h3", "subsections of the h2 above them", 18, "orange"),
        (245, "h4-h6", "deeper detail — rarely needed in practice", 15, "purple"),
    ]
    for y, tag, desc, size, accent in rows:
        b += code(60, y + 10, tag, size + 4, ACCENTS[accent])
        b += text(150, y + 10, desc, size, TEXT)
        b += line(60, y + 26, 860, y + 26, "blue", dashed=True)
    b += note(60, 356, "Skipping levels (h2 straight to h4) breaks the outline screen-reader users navigate by — keep it a ladder.")
    return b + footer()


def block_vs_inline():
    b = header("Block vs inline flow", "Block elements stack vertically and take full width; inline elements flow inside a line of text like words.")
    b += text(40, 52, "Two layout behaviors in plain HTML", 23, TEXT, weight="bold")
    b += text(40, 78, "This is the CSS-free default every page starts from — the mental model behind the page skeleton.", 15, MUTED)
    b += box(60, 120, 780, 56, "block: <p>", "full width, new line, height from content", "blue")
    b += box(60, 190, 780, 56, "block: <p>", None, "blue")
    b += box(60, 270, 220, 50, "text", None, "green")
    b += box(300, 270, 150, 50, "inline <a>", "flows in the line", "orange")
    b += box(470, 270, 120, 50, "more text", None, "green")
    b += box(610, 270, 160, 50, "inline <strong>", None, "orange")
    b += text(60, 348, "inline boxes ignore width/height and wrap like words", 13, MUTED)
    b += note(60, 356, "A paragraph cannot contain a heading; a heading cannot sit inside a <span>. Content-model rules follow this picture.")
    return b + footer()


# ── Phase 2: Content and navigation ─────────────────────────────────

def list_types():
    b = header("Three list elements", "ul for unordered sets, ol for ordered sequences, dl for name–value groups. Lists are the honest way to mark up 'a group of things'.")
    b += text(40, 52, "Pick by meaning, not by bullet style", 23, TEXT, weight="bold")
    b += text(40, 78, "The bullet/number rendering is CSS's business; the element's job is to tell the browser 'this is a list'.", 15, MUTED)
    b += box(60, 120, 250, 120, "ul", "unordered: order does not matter", "green")
    b += code(80, 165, "<li>…</li>", 14, MUTED)
    b += box(350, 120, 250, 120, "ol", "ordered: sequence is part of the meaning", "blue")
    b += code(370, 165, "1. 2. 3.", 14, MUTED)
    b += box(640, 120, 240, 120, "dl", "description: term + definition pairs", "orange")
    b += code(660, 165, "<dt> / <dd>", 14, MUTED)
    b += text(60, 270, "recipes, rankings, steps", 13, MUTED)
    b += text(60, 290, "-> ol, almost always", 13, MUTED)
    b += text(350, 270, "menus, tags, feature lists", 13, MUTED)
    b += text(350, 290, "-> ul, almost always", 13, MUTED)
    b += text(640, 270, "glossaries, metadata pairs,", 13, MUTED)
    b += text(640, 290, "FAQ question/answer groups", 13, MUTED)
    b += note(60, 356, "Lists can nest (a ul inside an li) — screen readers announce nesting depth, so keep structures shallow and real.")
    return b + footer()


def url_anatomy():
    b = header("Anatomy of a URL", "scheme says how to talk, host says who, path says what, query adds parameters, fragment points inside the page.")
    b += text(40, 52, "Every href is a URL — learn its parts", 23, TEXT, weight="bold")
    b += text(40, 78, "Fragments never reach the server: the browser handles them locally by scrolling to the matching id.", 15, MUTED)
    parts = [
        (60, 150, "https://", "scheme", "blue"),
        (215, 300, "developer.mozilla.org", "host", "green"),
        (520, 235, "/en-US/docs/Web/HTML", "path", "orange"),
        (760, 120, "#links", "fragment", "purple"),
    ]
    for x, w, code_txt, label, accent in parts:
        b += box(x, 140, w, 70, code_txt, None, accent)
        b += text(x + w / 2, 240, label, 14, ACCENTS[accent], anchor="middle")
    b += line(60, 270, 300, 270, "blue", dashed=True)
    b += text(60, 292, "?q=html&lang=en — query (server-side parameters)", 14, MUTED)
    b += note(60, 356, "Relative URLs ('./about.html', '../img/bug.png') resolve against the current page's URL — they keep working when the site moves.")
    return b + footer()


def link_types():
    b = header("The many jobs of <a>", "Anchors navigate pages, sections of the current page, email, phone, and file downloads — one element, five jobs.")
    b += text(40, 52, "One element, five destinations", 23, TEXT, weight="bold")
    b += text(40, 78, "href decides the job. Omit href and the anchor is just a placeholder target with no link behavior.", 15, MUTED)
    rows = [
        ("https://example.com/page", "another page (same or other site)", "blue"),
        ("/roadmap/html/#topics", "a fragment: scroll to an id on the page", "green"),
        ("mailto:hi@example.com", "opens the visitor's email client", "orange"),
        ("tel:+40712345678", "dials on mobile devices", "orange"),
        ('href="report.pdf" download', "downloads instead of navigating", "purple"),
    ]
    y = 110
    for href, desc, accent in rows:
        b += box(60, y, 400, 40, href, None, accent)
        b += text(490, y + 26, desc, 14, MUTED)
        y += 48
    b += note(60, 356, "Link text should describe the destination ('read the HTML standard'), never 'click here' — screen-reader users skim link lists.")
    return b + footer()


def img_responsive():
    b = header("Responsive images with srcset", "srcset offers candidate files; sizes tells the browser how wide the image will render. The browser picks the best file.")
    b += text(40, 52, "One <img>, several candidate files", 23, TEXT, weight="bold")
    b += text(40, 78, "You describe the options; the browser decides using viewport width, DPI, and user settings like data-saver.", 15, MUTED)
    b += code(60, 120, '<img src="photo-800.jpg"', 16, ACCENTS["blue"])
    b += code(90, 148, 'srcset="photo-400.jpg 400w, photo-800.jpg 800w, photo-1600.jpg 1600w"', 16, MUTED)
    b += code(90, 176, 'sizes="(max-width: 600px) 100vw, 50vw"', 16, MUTED)
    b += code(60, 204, 'alt="A ladybug on a leaf">', 16, ACCENTS["blue"])
    b += box(60, 240, 260, 70, "phone 400px wide", "100vw -> picks 400w file", "green")
    b += box(350, 240, 260, 70, "laptop, 2x screen", "50vw of 1440px -> 1600w file", "orange")
    b += box(640, 240, 240, 70, "retina + data saver", "may pick smaller anyway", "purple")
    b += note(60, 356, "The 'w' values are real pixel widths of the files, and sizes is a layout promise — measure the rendered slot, then write it.")
    return b + footer()


def picture_art_direction():
    b = header("Art direction with <picture>", "picture chooses different images by media condition — not just different sizes, different crops or formats.")
    b += text(40, 52, "When srcset is not enough", 23, TEXT, weight="bold")
    b += text(40, 78, "Use picture when the IMAGE CONTENT should change: a wide crop on desktop, a tight crop on mobile, AVIF/WebP where supported.", 15, MUTED)
    b += code(60, 120, "<picture>", 16, ACCENTS["blue"])
    b += code(90, 148, '<source media="(min-width: 800px)" srcset="wide.avif">', 16, MUTED)
    b += code(90, 176, '<source type="image/webp" srcset="photo.webp">', 16, MUTED)
    b += code(90, 204, '<img src="photo.jpg" alt="Sage plant on a desk">', 16, ACCENTS["orange"])
    b += code(60, 232, "</picture>", 16, ACCENTS["blue"])
    b += text(60, 270, "first match wins; the <img> is the fallback and the required alt-text home", 13, MUTED)
    b += box(60, 296, 380, 60, "media=", "viewport condition (art direction)", "green")
    b += box(480, 296, 380, 60, "type=", "format condition (modern codecs)", "purple")
    b += note(60, 356, "Every picture needs an <img> child — it carries alt, sizing, and the fallback for browsers that match no source.")
    return b + footer()


def figure_anatomy():
    b = header("Figure and caption", "figure marks self-contained content referenced from the text; figcaption is its visible, machine-readable caption.")
    b += text(40, 52, "Content that could stand alone", 23, TEXT, weight="bold")
    b += text(40, 78, "A figure can move to an appendix without breaking the surrounding paragraphs — that is the test.", 15, MUTED)
    b += box(120, 110, 420, 200, "<figure>", None, "blue")
    b += box(150, 150, 360, 90, "img / code / table / chart", "any flow content", "green")
    b += box(150, 260, 360, 40, "<figcaption>", "caption — first or last child", "orange")
    b += box(600, 110, 280, 200, "the surrounding <p>", "text refers to 'figure 1'", "purple")
    b += arrow(546, 210, 596, 210, "green", "referenced by")
    b += note(60, 356, "figcaption is announced with the image by screen readers — it complements alt text, it does not replace it.")
    return b + footer()


def media_elements():
    b = header("Native media elements", "video, audio, and track give the browser's built-in player — with attributes for behavior and tracks for captions.")
    b += text(40, 52, "Media without plugins", 23, TEXT, weight="bold")
    b += text(40, 78, "controls, poster, muted, and preload shape the experience; captions are both an accessibility and a legal standard.", 15, MUTED)
    b += code(60, 120, '<video controls poster="cover.jpg" muted preload="metadata">', 15, ACCENTS["blue"])
    b += code(90, 148, '<source src="clip.webm" type="video/webm">', 15, MUTED)
    b += code(90, 176, '<source src="clip.mp4" type="video/mp4">', 15, MUTED)
    b += code(90, 204, '<track src="subs-en.vtt" kind="captions" srclang="en" label="English">', 15, ACCENTS["orange"])
    b += code(60, 232, "</video>", 15, ACCENTS["blue"])
    b += box(60, 266, 270, 60, "source list", "first supported format wins", "green")
    b += box(370, 266, 260, 60, "track", "captions · subtitles · chapters", "orange")
    b += box(670, 266, 210, 60, "fallback content", "text between the tags", "purple")
    b += note(60, 356, "Autoplay only works muted in most browsers — and muted autoplay plus a visible play control is the accessible pattern.")
    return b + footer()


def table_anatomy():
    b = header("Table anatomy", "A data table has a caption, column definitions, and three row groups: thead, tbody, and tfoot.")
    b += text(40, 52, "Tables describe data — they are not layout", 23, TEXT, weight="bold")
    b += text(40, 78, "Each part has a job; skipping the parts is what makes tables unreadable to assistive technology.", 15, MUTED)
    b += box(60, 110, 520, 44, "<caption>", "title of the table, read first", "purple")
    b += box(60, 160, 520, 60, "<thead>", "column headers — <th scope=\"col\">", "blue")
    b += box(60, 226, 520, 60, "<tbody>", "the actual data rows", "green")
    b += box(60, 292, 520, 44, "<tfoot>", "totals / summary rows", "orange")
    b += box(620, 160, 260, 176, "<colgroup>", "per-column styling hooks (width, borders) — presentational only", "red")
    b += note(60, 356, "Screen readers reconstruct the table from these groups: a th without scope or a table without caption loses its map.")
    return b + footer()


def table_scope():
    b = header("How screen readers read a cell", "th scope connects each header cell to the data cells it governs — row, column, or both.")
    b += text(40, 52, "scope is the table's coordinate system", 23, TEXT, weight="bold")
    b += text(40, 78, "With scope, a screen reader can announce 'Price, row March, column Europe' instead of a meaningless cell value.", 15, MUTED)
    b += box(200, 120, 160, 44, 'th scope="col"', None, "blue")
    b += box(370, 120, 160, 44, 'th scope="col"', None, "blue")
    b += box(200, 175, 160, 44, "<td>", "data cell", "green")
    b += box(370, 175, 160, 44, "<td>", "data cell", "green")
    b += box(40, 175, 140, 44, 'th scope="row"', None, "orange")
    b += arrow(280, 168, 280, 186, "blue", "column header")
    b += arrow(450, 168, 450, 186, "blue", "column header")
    b += arrow(196, 197, 176, 197, "orange", "row header")
    b += note(60, 280, 'Header cells are th (with scope); data cells are td. <th scope="row"> marks the first cell of a row as its header.')
    b += note(60, 310, "For two-axis tables add headers/id pairs; for layout pretending, use CSS grid instead of tables.")
    b += note(60, 356, "Rule of thumb: if removing a row or column changes the meaning of other cells, it is data — use a real table.")
    return b + footer()


# ── Phase 3: Forms and data ─────────────────────────────────────────

def form_anatomy():
    b = header("Anatomy of a form", "A form is a contract between the page and the server: method says how, action says where, controls carry the values.")
    b += text(40, 52, "Every control needs a name", 23, TEXT, weight="bold")
    b += text(40, 78, "Only controls with a name attribute are submitted — an unnamed input sends nothing, a classic bug.", 15, MUTED)
    b += box(60, 110, 500, 220, '<form action="/subscribe" method="post">', None, "blue")
    b += box(90, 150, 200, 50, "label", 'for="email"', "orange")
    b += box(320, 150, 210, 50, "input", 'name="email"', "green")
    b += box(90, 230, 200, 50, "button", "type=\"submit\"", "purple")
    b += text(320, 260, "labels, hints, error slots", 13, MUTED)
    b += arrow(560, 220, 620, 220, "green", "on submit")
    b += box(620, 185, 260, 70, "server", "receives name=value pairs", "red")
    b += note(60, 356, "The submitted payload is just name=value pairs (&email=sage%40code.dev) — names are the API of your form.")
    return b + footer()


def label_association():
    b = header("Labeling a control", "A label tells every user what a control is for — click the label, focus moves to the control; screen readers read it aloud.")
    b += text(40, 52, "Three ways to label — two are correct", 23, TEXT, weight="bold")
    b += text(40, 78, "An input without an accessible name is announced as 'edit text' — the fastest way to fail an accessibility audit.", 15, MUTED)
    b += box(60, 120, 380, 90, "explicit: for + id", 'best: works across the document', "green")
    b += code(80, 165, '<label for="em">Email</label>', 14, MUTED)
    b += box(480, 120, 380, 90, "implicit: wrap the control", "good: one label per control", "blue")
    b += code(500, 165, '<label>Email <input ...></label>', 14, MUTED)
    b += box(60, 240, 380, 80, "aria-label", "last resort: invisible to sighted users", "red")
    b += code(80, 285, '<input aria-label="Email">', 14, MUTED)
    b += box(480, 240, 380, 80, "anti-pattern: placeholder", "vanishes on input — not a label", "red")
    b += note(60, 356, "Group related controls with fieldset + legend (radio sets, addresses) — the legend becomes the group's accessible name.")
    return b + footer()


def input_types():
    b = header("Input types are semantics, not skin", "Each input type brings a tailored keyboard, built-in validation, and a semantic role. Never default to type=\"text\".")
    b += text(40, 52, "Choosing an input type", 23, TEXT, weight="bold")
    b += text(40, 78, "email shows an @ keyboard on phones; number constrains input; date opens a picker — behavior ships free with the type.", 15, MUTED)
    rows = [
        ("text", "single line, anything goes", "blue"),
        ("email / url / tel", "mobile keyboards + format validation", "green"),
        ("number / range", "spinner / slider with min, max, step", "orange"),
        ("date / time / month", "native pickers, locale aware", "purple"),
        ("checkbox / radio", "on-off and choose-one groups", "red"),
        ("password / hidden", "masked input / not displayed, still submitted", "blue"),
    ]
    y = 110
    for typ, desc, accent in rows:
        b += box(60, y, 300, 40, typ, None, accent)
        b += text(390, y + 26, desc, 14, MUTED)
        y += 46
    b += note(60, 356, "file, color, and search complete the set — and type=\"search\" gains native clear affordances on some platforms.")
    return b + footer()


def form_submit_flow():
    b = header("What happens on submit", "Submit fires validation first; a valid form is encoded and sent by GET or POST; the server answers with a new page or data.")
    b += text(40, 52, "The browser does more than you think", 23, TEXT, weight="bold")
    b += text(40, 78, "Understanding this flow tells you when you need JavaScript: almost never for validation, often for feedback.", 15, MUTED)
    b += box(60, 130, 190, 80, "1. submit event", "button or Enter key", "blue")
    b += box(300, 130, 210, 80, "2. constraint check", "pattern, required, type…", "orange")
    b += box(560, 130, 210, 80, "3. encode", "urlencoded / multipart", "green")
    b += box(60, 250, 210, 80, "4. HTTP request", "GET or POST to action", "purple")
    b += box(310, 250, 210, 80, "5. server responds", "redirect or result page", "red")
    b += arrow(256, 170, 296, 170, "green")
    b += arrow(516, 170, 556, 170, "green")
    b += arrow(410, 214, 250, 246, "green")
    b += arrow(276, 290, 306, 290, "green")
    b += arrow(516, 290, 560, 200, "red", "invalid? block + show errors", )
    _ = 560
    b += note(60, 356, "GET puts values in the URL (shareable, for searches); POST puts them in the body (required for anything that changes data).")
    return b + footer()


def constraint_validation():
    b = header("The constraint validation pipeline", "Attributes declare the rules; the browser enforces them before any network request and exposes the state to CSS and JS.")
    b += text(40, 52, "Declare rules where the data lives", 23, TEXT, weight="bold")
    b += text(40, 78, "required, minlength, maxlength, min, max, step, pattern — the browser checks them all before submit.", 15, MUTED)
    b += code(60, 120, '<input type="email" name="em" required', 16, ACCENTS["blue"])
    b += code(90, 148, 'minlength="5" maxlength="60"', 16, MUTED)
    b += code(90, 176, 'pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$"', 16, MUTED)
    b += code(60, 204, 'title="Use a valid email address">', 16, ACCENTS["blue"])
    b += box(60, 240, 260, 70, ":valid / :invalid", "CSS reacts to the state", "green")
    b += box(360, 240, 250, 70, "checkValidity()", "JS asks the same question", "orange")
    b += box(650, 240, 220, 70, "validationMessage", "localized error text, free", "purple")
    b += note(60, 356, "novalidate on the form disables this pipeline for custom UI — then JS must reproduce every rule you dropped.")
    return b + footer()


# ── Phase 4: Semantics, metadata, accessibility ─────────────────────

def landmark_map():
    b = header("Landmark regions", "Semantic elements become named landmarks that screen-reader users jump between — a table of contents for every page.", 920, 430)
    b += text(40, 52, "The same page, navigable in seconds", 23, TEXT, weight="bold")
    b += text(40, 78, "header, nav, main, aside, and footer map to landmark roles — without writing a single ARIA attribute.", 15, MUTED)
    b += box(160, 110, 600, 56, "<header>", "site identity + h1 — banner landmark", "blue")
    b += box(160, 178, 600, 50, "<nav>", "the site's main menu — navigation landmark", "green")
    b += box(160, 240, 400, 90, "<main>", "the unique content of THIS page — main landmark", "orange")
    b += box(575, 240, 185, 90, "<aside>", "related but optional", "purple")
    b += box(160, 336, 600, 44, "<footer>", "copyright, colophon — contentinfo landmark", "blue")
    b += note(60, 410, 'Rule: exactly one visible <main> per page. Skip link first: <a class="skip" href="#main">Skip to content</a>.')
    return b + footer()


def sectioning_decision():
    b = header("article, section, or div?", "A decision tree for containers: ask what the content IS, then whether it could carry its own heading in a feed.")
    b += text(40, 52, "Work down the tree", 23, TEXT, weight="bold")
    b += text(40, 78, "Div is not a failure — it is the correct answer when the grouping is purely visual.", 15, MUTED)
    b += diamond(460, 130, 260, 70, "self-contained work?", "orange")
    b += diamond(230, 230, 240, 70, "makes sense in a feed?", "green")
    b += diamond(690, 230, 240, 70, "needed for CSS/JS only?", "green")
    b += box(80, 310, 280, 60, "<article>", "blog post, card, comment, product", "blue")
    b += box(400, 310, 260, 60, "<section>", "thematic chapter with a heading", "purple")
    b += box(700, 310, 180, 60, "<div>", "styling or scripting hook", "red")
    b += arrow(400, 168, 300, 192, "green", "yes")
    b += arrow(520, 168, 640, 192, "green", "no")
    b += arrow(200, 268, 190, 306, "green", "yes")
    b += arrow(300, 268, 420, 306, "green", "no")
    b += arrow(660, 268, 620, 306, "green", "no")
    b += arrow(740, 268, 760, 306, "green", "yes")
    b += note(60, 400, "A section without a heading is usually a sign you wanted div — or that the heading is missing.")
    return b + footer()


def a11y_tree():
    b = header("The accessibility tree", "The browser derives an accessibility tree from the DOM plus ARIA; assistive technology reads that tree, not your HTML.")
    b += text(40, 52, "Screen readers never see your tags", 23, TEXT, weight="bold")
    b += text(40, 78, "Semantics in, semantics out: a div-based button is invisible as a button unless ARIA recreates what HTML gives for free.", 15, MUTED)
    b += box(60, 130, 220, 70, "DOM", "your HTML elements", "blue")
    b += box(350, 130, 230, 70, "accessibility tree", "names, roles, states", "orange")
    b += box(650, 130, 230, 70, "assistive tech", "screen reader, switch, braille", "green")
    b += arrow(286, 165, 346, 165, "green")
    b += arrow(586, 165, 646, 165, "green")
    b += box(350, 250, 230, 70, "name + role + value", 'what every widget must expose', "purple")
    b += arrow(465, 200, 465, 246, "orange")
    b += note(60, 350, "Native elements win: a real <button> carries role, focus, and keyboard behavior with zero extra code.")
    return b + footer()


def focus_order():
    b = header("Focus order and tabindex", "Keyboard users move in DOM order. tabindex 0 joins the natural order; positive values break it; negative removes from tabbing.")
    b += text(40, 52, "Tab follows the source, not the layout", 23, TEXT, weight="bold")
    b += text(40, 78, "CSS can move anything anywhere visually — the tab ring still walks the DOM. Keep the DOM order logical.", 15, MUTED)
    b += box(60, 130, 180, 60, "1", "nav link", "green")
    b += box(270, 130, 180, 60, "2", "search input", "green")
    b += box(480, 130, 180, 60, "3", "search button", "green")
    b += box(690, 130, 190, 60, "4", "main content link", "green")
    b += box(60, 240, 260, 70, 'tabindex="0"', "join natural order (custom widgets)", "orange")
    b += box(360, 240, 260, 70, 'tabindex="-1"', "focusable by JS, not by Tab (modals)", "purple")
    b += box(660, 240, 220, 70, 'tabindex="1+"', "breaks order — never ship this", "red")
    b += note(60, 356, "Visible focus is not optional: :focus-visible styles keep the ring; outline: none without replacement fails WCAG 2.4.7.")
    return b + footer()


def aria_decision():
    b = header("The ARIA decision flow", "First rule of ARIA: do not use ARIA. Native HTML already covers 90 percent of widgets and carries none of the maintenance cost.")
    b += text(40, 52, "Ask in order", 23, TEXT, weight="bold")
    b += text(40, 78, "ARIA adds roles and states on top of the accessibility tree — it changes semantics, never behavior.", 15, MUTED)
    b += diamond(250, 140, 300, 70, "does an HTML element exist?", "orange")
    b += diamond(620, 140, 300, 70, "can you reuse it with ARIA enhancement?", "green")
    b += box(120, 230, 260, 60, "use the native element", "<button>, <a>, <input> — done", "green")
    b += box(480, 230, 300, 60, "native + ARIA attribute", "e.g. aria-expanded on a disclosure", "blue")
    b += box(760, 230, 120, 60, "full ARIA pattern", "grid, tree, tablist + JS wiring", "red")
    b += arrow(250, 176, 250, 226, "green", "yes")
    b += arrow(430, 165, 466, 165, "green", "no")
    b += arrow(620, 176, 500, 226, "green", "yes")
    b += arrow(770, 176, 820, 226, "green", "no")
    b += note(60, 330, "Roles without behavior are a trap: role=\"button\" on a div still needs tabindex, keydown handlers, and state announcements.")
    b += note(60, 356, "Prefer: native element > native + ARIA attribute > full ARIA pattern with complete keyboard support.")
    return b + footer()


def metadata_layers():
    b = header("Metadata layers in <head>", "Layer 1 makes the page work, layer 2 makes it rank, layer 3 makes it share. Each layer is read by a different machine.")
    b += text(40, 52, "Three audiences, three layers", 23, TEXT, weight="bold")
    b += text(40, 78, "Write the layers in this order and audits stop finding duplicates, missing images, and wrong locales.", 15, MUTED)
    b += box(60, 110, 800, 70, "Layer 1 - function", "charset · viewport · title · description · canonical · favicon", "blue")
    b += box(60, 195, 800, 70, "Layer 2 - search engines", "robots meta · hreflang · structured data (JSON-LD)", "green")
    b += box(60, 280, 800, 70, "Layer 3 - social sharing", "Open Graph (og:*) · Twitter card tags", "orange")
    b += text(60, 374, "layer 1: browsers and crawlers   layer 2: ranking systems   layer 3: link-preview generators", 13, FAINT)
    return b + footer()


def og_card():
    b = header("How a social card is built", "When a URL is shared, the platform fetches its og: tags and renders a card — your markup IS the preview.")
    b += text(40, 52, "og:title, og:description, og:image", 23, TEXT, weight="bold")
    b += text(40, 78, "Crawlers do not run your JavaScript reliably — the tags must be in the served HTML (one reason SSR exists).", 15, MUTED)
    b += code(60, 120, '<meta property="og:title" content="HTML Roadmap">', 15, MUTED)
    b += code(60, 148, '<meta property="og:description" content="Semantic HTML, forms, a11y.">', 15, MUTED)
    b += code(60, 176, '<meta property="og:image" content="https://sagecode.org/images/SageCode.jpg">', 15, MUTED)
    b += code(60, 204, '<meta property="og:url" content="https://sagecode.org/roadmap/html/">', 15, MUTED)
    b += box(60, 240, 380, 100, "the rendered card", "image on top, title, description, domain", "purple")
    b += box(480, 240, 380, 100, "debugging", "Facebook Sharing Debugger, Twitter Card Validator — validate before shipping", "green")
    b += note(60, 356, "og:image wants an absolute URL and a 1200x630 image — relative paths and tiny logos render as broken cards.")
    return b + footer()


def json_ld():
    b = header("Structured data with JSON-LD", "A script block of type application/ld+json describes what the page IS in a vocabulary search engines parse directly.")
    b += text(40, 52, "HTML describes structure; JSON-LD describes meaning", 23, TEXT, weight="bold")
    b += text(40, 78, "Course, Article, FAQPage, BreadcrumbList — schema.org types can earn rich results in search.", 15, MUTED)
    b += code(60, 120, '<script type="application/ld+json">', 15, ACCENTS["purple"])
    b += code(90, 148, '{', 15, MUTED)
    b += code(110, 176, '"@context": "https://schema.org",', 15, MUTED)
    b += code(110, 204, '"@type": "Course",', 15, MUTED)
    b += code(110, 232, '"name": "HTML5 Tutorial", "provider": {...}', 15, MUTED)
    b += code(90, 260, '}', 15, MUTED)
    b += code(60, 288, '</script>', 15, ACCENTS["purple"])
    b += box(480, 130, 380, 120, "invisible to users", "never replaces visible content", "blue")
    b += box(480, 270, 380, 100, "validate", "Google Rich Results Test + validator.schema.org", "green")
    b += note(60, 356, "JSON-LD must be valid JSON — a trailing comma silently kills the whole block for crawlers.")
    return b + footer()


# ── Phase 5: Platform and tooling ───────────────────────────────────

def data_attributes():
    b = header("The data-* contract", "data-* attributes attach machine-readable values to elements without inventing non-standard attributes.")
    b += text(40, 52, "Custom metadata that stays valid", 23, TEXT, weight="bold")
    b += text(40, 78, "dataset in JavaScript mirrors the DOM: data-product-id becomes element.dataset.productId.", 15, MUTED)
    b += code(60, 120, '<tr data-product-id="42" data-stock="low">', 16, ACCENTS["blue"])
    b += code(90, 148, "<td>Sage seeds</td>", 16, MUTED)
    b += code(60, 176, "</tr>", 16, ACCENTS["blue"])
    b += box(60, 220, 380, 80, "HTML side", "data-<name>=\"<value>\" — lowercase, no camelCase", "green")
    b += box(480, 220, 380, 80, "JS side", "el.dataset.productId / getAttribute('data-...')", "orange")
    b += arrow(440, 260, 476, 260, "green", "the bridge")
    b += note(60, 330, "CSS reads them too: [data-stock=\"low\"] { color: var(--warn) } — state that styles and scripts agree on.")
    b += note(60, 356, "Never repurpose aria-* or invented attributes: data-* is the standard's own extension point.")
    return b + footer()


def template_dialog():
    b = header("Inert markup: template and dialog", "template holds HTML the browser parses but does not render; dialog renders on demand with one method call.")
    b += text(40, 52, "HTML that waits for JavaScript", 23, TEXT, weight="bold")
    b += text(40, 78, "Both solve 'UI that exists before it is shown' — without display:none hacks or string concatenation.", 15, MUTED)
    b += code(60, 120, '<template id="row-tpl">', 16, ACCENTS["blue"])
    b += code(90, 148, '<tr><td class="name"></td><td class="qty"></td></tr>', 16, MUTED)
    b += code(60, 176, "</template>", 16, ACCENTS["blue"])
    b += code(60, 204, "tpl.content.cloneNode(true)  // then fill and append", 15, ACCENTS["green"])
    b += code(60, 240, '<dialog id="confirm">…</dialog>', 16, ACCENTS["purple"])
    b += code(60, 268, "dlg.showModal()  // focus trap + Esc + ::backdrop, free", 15, ACCENTS["green"])
    b += box(480, 120, 380, 100, "<template>", "inert: images don't load, scripts don't run", "orange")
    b += box(480, 240, 380, 100, "<dialog>", "top-layer rendering, accessible by default", "purple")
    b += note(60, 356, "Cloning a template beats building HTML strings: no injection risk, and the parser checks your markup once.")
    return b + footer()


def svg_vs_canvas():
    b = header("Inline SVG vs canvas", "SVG keeps shapes in the DOM (styleable, accessible, scalable); canvas paints pixels and forgets them.")
    b += text(40, 52, "Vector DOM or pixel buffer", 23, TEXT, weight="bold")
    b += text(40, 78, "Icons, charts, and diagrams belong in SVG; games and thousands of points belong in canvas.", 15, MUTED)
    b += box(60, 120, 380, 150, "inline <svg>", None, "green")
    b += text(80, 165, "retained DOM nodes", 14, MUTED)
    b += text(80, 190, "CSS can style parts; JS can bind events", 14, MUTED)
    b += text(80, 215, "crisp at any zoom", 14, MUTED)
    b += text(80, 240, "accessible with <title> + role", 14, MUTED)
    b += box(480, 120, 380, 150, "<canvas>", None, "orange")
    b += text(500, 165, "immediate-mode pixel drawing", 14, MUTED)
    b += text(500, 190, "fast for thousands of moving items", 14, MUTED)
    b += text(500, 215, "no DOM per shape; redraw everything", 14, MUTED)
    b += text(500, 240, "text inside is invisible to a11y tools", 14, MUTED)
    b += note(60, 300, "Standalone SVG images need role=\"img\" and a <title> — or use <img src=\"diagram.svg\" alt=\"...\"> and inherit alt text.")
    b += note(60, 356, "SVG in <img> cannot run scripts or load external fonts — a security feature worth knowing.")
    return b + footer()


def shadow_dom():
    b = header("Custom elements and Shadow DOM", "customElements defines new tags; a shadow root gives each one a private DOM and stylesheet scope.")
    b += text(40, 52, "Reusable widgets in vanilla HTML", 23, TEXT, weight="bold")
    b += text(40, 78, "The page's CSS cannot leak in, the widget's CSS cannot leak out — encapsulation as a platform feature.", 15, MUTED)
    b += box(60, 120, 300, 70, "<sage-rating>", "custom element (JS class)", "purple")
    b += box(420, 120, 200, 70, "shadow root", "attachShadow({mode:'open'})", "blue")
    b += box(660, 120, 200, 70, "shadow tree", "its own <style>, markup", "green")
    b += arrow(366, 155, 416, 155, "purple")
    b += arrow(626, 155, 656, 155, "blue")
    b += box(60, 240, 380, 80, "light DOM", "what the page writes: <sage-rating>…</sage-rating>", "orange")
    b += box(480, 240, 380, 80, "slot", "where the light DOM renders inside the shadow tree", "red")
    b += arrow(250, 240, 560, 200, "orange", "projected via <slot>")
    b += note(60, 356, "Frameworks wrap these ideas; the platform versions need no build step and interoperate with all of them.")
    return b + footer()


def validation_workflow():
    b = header("The validation workflow", "Validate early, validate often: the W3C validator catches unclosed tags, bad nesting, and broken attributes in seconds.")
    b += text(40, 52, "A loop, not a final step", 23, TEXT, weight="bold")
    b += text(40, 78, "Valid HTML is the cheapest bug prevention in web development — most rendering bugs are invalid nesting.", 15, MUTED)
    b += box(60, 120, 240, 70, "1. author", "write the page", "blue")
    b += box(340, 120, 240, 70, "2. validate", "validator.w3.org or Nu", "green")
    b += box(620, 120, 240, 70, "3. fix", "errors first, then warnings", "orange")
    b += arrow(306, 155, 336, 155, "green")
    b += arrow(586, 155, 616, 155, "green")
    b += arrow(740, 196, 180, 310, "purple", "regression: re-run on every change")
    b += arrow(180, 310, 180, 196, "purple")
    b += box(340, 260, 240, 70, "4. audit", "Lighthouse + aXe for a11y and perf", "purple")
    b += note(60, 356, "CI tip: the Nu validator ships a local Docker image and an API — validation can be a build step, not a memory.")
    return b + footer()


def quirks_vs_standards():
    b = header("Quirks mode vs standards mode", "The doctype is a parser switch: without it, the browser emulates 1998 layout bugs that no modern CSS expects.")
    b += text(40, 52, "One line decides which engine you get", 23, TEXT, weight="bold")
    b += text(40, 78, "document.compatMode tells you where you are — 'CSS1Compat' is the only mode worth shipping.", 15, MUTED)
    b += box(60, 120, 400, 130, "missing / old doctype", None, "red")
    b += text(80, 165, "quirks mode", 15, ACCENTS["red"])
    b += text(80, 190, "box-sizing inconsistencies", 13, MUTED)
    b += text(80, 215, "different table and image baseline rules", 13, MUTED)
    b += text(80, 240, "JS feature detection lies", 13, MUTED)
    b += box(500, 120, 360, 130, "<!DOCTYPE html>", None, "green")
    b += text(520, 165, "standards mode", 15, ACCENTS["green"])
    b += text(520, 190, "spec-compliant rendering", 13, MUTED)
    b += text(520, 215, "same behavior across browsers", 13, MUTED)
    b += text(520, 240, "the only mode DevTools assumes", 13, MUTED)
    b += note(60, 300, "In DevTools the docmode tooltip shows the mode; if it says quirks, stop debugging CSS and fix the doctype first.")
    b += note(60, 356, "XML mode (application/xhtml+xml) is a third path with stricter parsing — rare, and unforgiving of one bad tag.")
    return b + footer()


def debugging_loop():
    b = header("Debugging HTML in DevTools", "Elements pane shows the live DOM (not your source), the Console shows parse warnings, Lighthouse audits quality.")
    b += text(40, 52, "Source vs live DOM — know the difference", 23, TEXT, weight="bold")
    b += text(40, 78, "The parser repairs mistakes (moves tags, closes elements). The Elements pane shows the repaired result.", 15, MUTED)
    b += box(60, 120, 250, 90, "Elements", "live DOM tree, computed styles, a11y pane", "blue")
    b += box(340, 120, 250, 90, "Console", "parse errors, malformed-nesting warnings", "orange")
    b += box(620, 120, 240, 90, "Lighthouse", "a11y, SEO, best-practice audits", "green")
    b += box(60, 250, 250, 80, "view-source:", "what YOU wrote — static text", "purple")
    b += box(340, 250, 250, 80, "inspector", "what the browser KEPT after repair", "red")
    b += box(620, 250, 240, 80, "diff = parser repair", "the bug was in your source", "orange")
    b += note(60, 356, "A table rendering outside its table, or a style bleeding everywhere — check for a stray tag the parser had to relocate.")
    return b + footer()


# ── Phase 6: Delivery and quality ───────────────────────────────────

def critical_path():
    b = header("The critical rendering path", "HTML and CSS must both arrive before first paint; JavaScript is the only one that can wait.")
    b += text(40, 52, "What the browser cannot paint without", 23, TEXT, weight="bold")
    b += text(40, 78, "Every resource in <head> is on this path. Moving things off it is what 'performance' means for HTML authors.", 15, MUTED)
    b += box(60, 120, 220, 80, "HTML", "the dependency root — always critical", "blue")
    b += box(340, 120, 220, 80, "CSS", "critical: no paint before CSSOM", "orange")
    b += box(620, 120, 220, 80, "defer JS", "non-critical: download parallel, run later", "green")
    b += box(200, 260, 220, 70, "render tree", "DOM + CSSOM", "purple")
    b += box(470, 260, 200, 70, "layout", "geometry for every box", "purple")
    b += box(710, 260, 150, 70, "paint", "pixels", "purple")
    b += arrow(286, 200, 280, 256, "green")
    b += arrow(450, 200, 445, 256, "orange")
    b += arrow(430, 295, 466, 295, "green")
    b += arrow(676, 295, 706, 295, "green")
    b += arrow(730, 200, 790, 256, "green", "runs after parse")
    b += note(60, 356, "An HTML-only page still needs its CSS to paint — inlining the tiny critical CSS beats a 200KB framework reset.")
    return b + footer()


def resource_hints():
    b = header("Loading attributes and resource hints", "defer, async, preload, prefetch, and preconnect each answer a different question about a resource.")
    b += text(40, 52, "The right tool per resource", 23, TEXT, weight="bold")
    b += text(40, 78, "Ask: does the page need this to render, to become interactive, or only later — maybe never?", 15, MUTED)
    rows = [
        ("defer", "scripts: parse continues, run in order at the end", "green"),
        ("async", "scripts: run when ready — order not guaranteed (analytics)", "green"),
        ('rel="preload"', "fetch something THIS page definitely needs soon", "blue"),
        ('rel="prefetch"', "fetch for the NEXT navigation, idle time", "blue"),
        ('rel="preconnect"', "warm up DNS+TLS to a third-party origin", "orange"),
        ("loading=\"lazy\"", "images/iframes: fetch when near the viewport", "purple"),
    ]
    y = 110
    for name, desc, accent in rows:
        b += box(60, y, 260, 40, name, None, accent)
        b += text(350, y + 26, desc, 14, MUTED)
        y += 44
    b += note(60, 356, "Preloading something the page barely uses steals bandwidth from the CSS that blocks paint — hints are a budget.")
    return b + footer()


def iframe_sandbox():
    b = header("Embedding with iframes, safely", "An iframe is a full browsing context inside your page. sandbox, allow, and loading decide how much it can do.")
    b += text(40, 52, "Third-party content, first-party risk", 23, TEXT, weight="bold")
    b += text(40, 78, "Everything the frame loads runs with its own origin — but without sandbox, it can navigate YOUR page.", 15, MUTED)
    b += code(60, 120, '<iframe src="https://maps.example.com/embed"', 15, ACCENTS["blue"])
    b += code(90, 148, 'sandbox="allow-scripts allow-same-origin"', 15, ACCENTS["orange"])
    b += code(90, 176, 'loading="lazy" title="Office location map" allowfullscreen>', 15, ACCENTS["orange"])
    b += box(60, 220, 260, 90, "sandbox tokens", "allow-scripts, allow-forms, allow-popups, allow-same-origin…", "orange")
    b += box(360, 220, 250, 90, "title attribute", "names the frame in the a11y tree", "green")
    b += box(650, 220, 210, 90, "lazy + width/height", "perf: no layout shift, no eager load", "purple")
    b += note(60, 330, "sandbox without allow-same-origin blocks the frame from touching your DOM and cookies — start strict, add tokens per need.")
    b += note(60, 356, "Every iframe needs a title — 'iframe' is what screen readers announce otherwise, for every frame on the page.")
    return b + footer()


def security_vectors():
    b = header("HTML's security surface", "Links, embeds, and external resources are the three doors an attacker uses. Each has a one-attribute fix.")
    b += text(40, 52, "Four risks every author inherits", 23, TEXT, weight="bold")
    b += text(40, 78, "None of these need a backend to matter — they are decisions in your markup, today.", 15, MUTED)
    rows = [
        ("tab-nabbing", "target=\"_blank\" page can control your tab", 'rel="noopener noreferrer"', "red"),
        ("mixed content", "http:// resource inside an https:// page", "always https: + upgrade-insecure-requests", "orange"),
        ("injection via embeds", "iframe/script from an unknown origin", "sandbox + CSP allowlist + SRI on scripts", "purple"),
        ("referrer leak", "full URL sent to linked sites", 'referrerpolicy="no-referrer" / strict-origin', "blue"),
    ]
    y = 110
    for name, risk, fix, accent in rows:
        b += box(60, y, 190, 56, name, None, accent)
        b += text(270, y + 26, risk, 13, MUTED)
        b += box(560, y, 300, 56, "fix", None, "green")
        b += text(575, y + 26, fix, 12, MUTED)
        y += 62
    b += note(60, 356, "CSP via <meta> covers the page it is on — a real header is stronger; SRI verifies a file was not tampered with.")
    return b + footer()


def ssr_hydration():
    b = header("SSR and hydration", "Server-side rendering ships complete HTML; hydration attaches event listeners so the same markup becomes a live app.")
    b += text(40, 52, "The same page, twice", 23, TEXT, weight="bold")
    b += text(40, 78, "Phase 1 is instant HTML (paint now); phase 2 is the framework waking it up (interact later).", 15, MUTED)
    b += box(60, 120, 260, 90, "1. server renders", "template -> full HTML string", "blue")
    b += box(360, 120, 240, 90, "2. browser paints", "content visible before JS", "green")
    b += box(640, 120, 220, 90, "3. hydration", "JS binds listeners + state", "orange")
    b += arrow(326, 165, 356, 165, "green")
    b += arrow(606, 165, 636, 165, "green")
    b += box(360, 260, 240, 80, "before hydration", "static: links work, buttons don't", "red")
    b += box(640, 260, 220, 80, "after", "fully interactive SPA", "green")
    b += note(60, 356, "Hydration mismatch bugs come from the server and client producing different HTML — semantics again, not styling.")
    return b + footer()


def framework_pipeline():
    b = header("Where HTML lives in a framework stack", "Components, templates, and JSX all compile down to HTML — the framework is a build step for markup, not a replacement for it.")
    b += text(40, 52, "Everything compiles to markup", 23, TEXT, weight="bold")
    b += text(40, 78, "Whoever writes the template decides the landmarks, the alt text, and the labels. That author is you.", 15, MUTED)
    b += box(60, 120, 190, 90, "component", "React/Vue/Svelte source", "blue")
    b += box(290, 120, 200, 90, "compiler", "template -> render code", "purple")
    b += box(530, 120, 180, 90, "HTML output", "the real DOM the user gets", "green")
    b += box(750, 120, 130, 90, "browser", "parse + paint", "orange")
    b += arrow(256, 165, 286, 165, "green")
    b += arrow(496, 165, 526, 165, "green")
    b += arrow(716, 165, 746, 165, "green")
    b += box(60, 260, 380, 80, "what survives the trip", "semantic tags, alt, labels, roles", "green")
    b += box(480, 260, 400, 80, "what gets lost", "div soup, missing alt, div-buttons", "red")
    b += note(60, 356, "Audit the OUTPUT, not the source: view-source and the a11y pane judge what actually ships.")
    return b + footer()


def email_html():
    b = header("HTML email: the old dialect", "Email clients render a 2005 dialect of HTML: tables for layout, inline styles, no scripts, no forms.")
    b += text(40, 52, "Same language, different rules", 23, TEXT, weight="bold")
    b += text(40, 78, "Gmail and Outlook sanitize aggressively: your modern CSS and semantic tags may simply vanish.", 15, MUTED)
    b += box(60, 120, 380, 110, "what works", "table layouts · inline style attributes · gif/jpg images · system fonts", "green")
    b += box(480, 120, 380, 110, "what breaks", "<script> · <form> · position/float · web fonts · external CSS files", "red")
    b += code(60, 260, '<table role="presentation" width="600">  <!-- the accepted email skeleton -->', 14, MUTED)
    b += note(60, 300, "role=\"presentation\" tells screen readers to skip table semantics you are only using for layout.")
    b += note(60, 356, "Test with Litmus or Email on Acid previews — or accept plain-text-first design and simpler maintenance.")
    return b + footer()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="list files without writing")
    parser.add_argument("--force", action="store_true", help="overwrite existing files")
    args = parser.parse_args()

    diagrams = {
        "html-element-anatomy.svg": element_anatomy,
        "html-document-tree.svg": document_tree,
        "html-void-vs-container.svg": void_vs_container,
        "html-whitespace-collapse.svg": whitespace_collapse,
        "html-document-anatomy.svg": document_anatomy,
        "html-head-contents.svg": head_contents,
        "html-parse-render-flow.svg": parse_render_flow,
        "html-heading-scale.svg": heading_scale,
        "html-block-vs-inline.svg": block_vs_inline,
        "html-list-types.svg": list_types,
        "html-url-anatomy.svg": url_anatomy,
        "html-link-types.svg": link_types,
        "html-img-responsive.svg": img_responsive,
        "html-picture-art-direction.svg": picture_art_direction,
        "html-figure-anatomy.svg": figure_anatomy,
        "html-media-elements.svg": media_elements,
        "html-table-anatomy.svg": table_anatomy,
        "html-table-scope.svg": table_scope,
        "html-form-anatomy.svg": form_anatomy,
        "html-label-association.svg": label_association,
        "html-input-types.svg": input_types,
        "html-form-submit-flow.svg": form_submit_flow,
        "html-constraint-validation.svg": constraint_validation,
        "html-landmark-map.svg": landmark_map,
        "html-sectioning-decision.svg": sectioning_decision,
        "html-a11y-tree.svg": a11y_tree,
        "html-focus-order.svg": focus_order,
        "html-aria-decision.svg": aria_decision,
        "html-metadata-layers.svg": metadata_layers,
        "html-og-card.svg": og_card,
        "html-json-ld.svg": json_ld,
        "html-data-attributes.svg": data_attributes,
        "html-template-dialog.svg": template_dialog,
        "html-svg-vs-canvas.svg": svg_vs_canvas,
        "html-shadow-dom.svg": shadow_dom,
        "html-validation-workflow.svg": validation_workflow,
        "html-quirks-vs-standards.svg": quirks_vs_standards,
        "html-debugging-loop.svg": debugging_loop,
        "html-critical-path.svg": critical_path,
        "html-resource-hints.svg": resource_hints,
        "html-iframe-sandbox.svg": iframe_sandbox,
        "html-security-vectors.svg": security_vectors,
        "html-ssr-hydration.svg": ssr_hydration,
        "html-framework-pipeline.svg": framework_pipeline,
        "html-email-html.svg": email_html,
    }

    os.makedirs(OUT, exist_ok=True)
    written = skipped = 0
    for name, fn in diagrams.items():
        path = os.path.join(OUT, name)
        if os.path.exists(path) and not args.force:
            print(f"[skip] {path} exists (use --force)")
            skipped += 1
            continue
        content = fn()
        if args.dry_run:
            print(f"[dry-run] would write {path}")
            continue
        with open(path, "w", encoding="utf-8", newline="\n") as f:
            f.write(content)
        print(f"[ok] {path}")
        written += 1
    print(f"\n{written} written, {skipped} skipped, {len(diagrams)} total")


if __name__ == "__main__":
    main()
