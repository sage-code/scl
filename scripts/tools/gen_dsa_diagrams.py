"""Generate the DSA roadmap diagrams (roadmap/dsa/img/*.svg).

Dark-theme spec: manual/ARCHITECTURE.md §Diagrams. Deterministic; re-run after edits:
    python scripts/tools/gen_dsa_diagrams.py
"""
from pathlib import Path

OUT = Path("roadmap/dsa/img")
BG, BOX, EDGE = "#0f172a", "#1e293b", "#475569"
TXT, SUB = "#e2e8f0", "#94a3b8"
ORANGE, BLUE, RED, GREEN, DARK = "#f59e0b", "#3b82f6", "#ef4444", "#34d399", "#0f172a"
FONT = 'font-family="sans-serif"'
MONO = 'font-family="monospace"'


def head(w, h, title, desc):
    return [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="100%" role="img" aria-labelledby="t d">',
        f"<title id=\"t\">{title}</title>",
        f"<desc id=\"d\">{desc}</desc>",
        '<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">'
        f'<path d="M0,0 L10,5 L0,10 z" fill="{SUB}"/></marker></defs>',
        f'<rect x="0" y="0" width="{w}" height="{h}" fill="{BG}"/>',
    ]


def box(x, y, w, h, fill=BOX, stroke=EDGE, rx=8):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="1.5"/>'


def text(x, y, s, size=14, fill=TXT, anchor="middle", bold=False, mono=False):
    weight = ' font-weight="bold"' if bold else ""
    fam = MONO if mono else FONT
    return f'<text x="{x}" y="{y}" {fam} font-size="{size}" fill="{fill}" text-anchor="{anchor}"{weight}>{s}</text>'


def arrow(points, label=None, lx=None, ly=None, anchor="start"):
    pts = " ".join(f"{x},{y}" for x, y in points)
    out = [f'<polyline points="{pts}" fill="none" stroke="{SUB}" stroke-width="2" marker-end="url(#arrow)"/>']
    if label:
        out.append(text(lx, ly, label, 12, SUB, anchor))
    return out


def save(name, parts):
    (OUT / name).write_text("\n".join(parts + ["</svg>"]) + "\n", encoding="utf-8", newline="\n")


# ---------------------------------------------------------------- workflow
def problem_solving():
    w, h = 680, 520
    p = head(w, h, "Problem-solving workflow",
             "Understand, examples, brute force, analyze; if not fast enough optimize and re-analyze; then implement and test.")
    p.append(text(w / 2, 30, "From problem to verified solution", 16, bold=True))
    bx, bw, bh = 90, 300, 52
    steps = [
        (52, "1. Understand", "inputs, outputs, constraints"),
        (124, "2. Examples", "typical + edge cases, expected results"),
        (196, "3. Brute force", "simplest correct solution = oracle"),
        (268, "4. Analyze", "time and space in Big O"),
    ]
    for y, t, s in steps:
        p.append(box(bx, y, bw, bh))
        p.append(text(bx + bw / 2, y + 22, t, 15, bold=True))
        p.append(text(bx + bw / 2, y + 41, s, 12, SUB))
    for (y, *_), (ny, *_) in zip(steps, steps[1:]):
        p += arrow([(bx + bw / 2, y + bh), (bx + bw / 2, ny - 2)])
    # decision diamond centred under the column
    cx, cy, dw, dh = bx + bw / 2, 384, 240, 72
    p.append(f'<polygon points="{cx},{cy - dh / 2} {cx + dw / 2},{cy} {cx},{cy + dh / 2} {cx - dw / 2},{cy}" '
             f'fill="{BOX}" stroke="{ORANGE}" stroke-width="2"/>')
    p.append(text(cx, cy - 2, "Fast enough for", 13))
    p.append(text(cx, cy + 15, "the constraints?", 13))
    p += arrow([(cx, 268 + bh), (cx, cy - dh / 2 - 2)])
    # optimize box to the right, loop back to Analyze
    ox, ow = 452, 196
    p.append(box(ox, cy - bh / 2, ow, bh))
    p.append(text(ox + ow / 2, cy - 4, "5. Optimize", 15, bold=True))
    p.append(text(ox + ow / 2, cy + 15, "remove repeated work", 12, SUB))
    p += arrow([(cx + dw / 2, cy), (ox - 2, cy)], "no", cx + dw / 2 + 12, cy - 8)
    p += arrow([(ox + ow / 2, cy - bh / 2), (ox + ow / 2, 294), (bx + bw + 2, 294)],
               "re-analyze", ox + ow / 2 + 8, 330)
    # implement & test (light highlight box -> dark text allowed)
    iy = 450
    p.append(box(bx, iy, bw, bh, fill=GREEN, stroke=GREEN))
    p.append(text(bx + bw / 2, iy + 22, "6. Implement &amp; test", 15, DARK, bold=True))
    p.append(text(bx + bw / 2, iy + 41, "table tests, compare with the oracle", 12, DARK))
    p += arrow([(cx, cy + dh / 2), (cx, iy - 2)], "yes", cx + 10, cy + dh / 2 + 20)
    save("dsa-problem-solving.svg", p)


# ---------------------------------------------------------------- call stack
def call_stack():
    w, h = 680, 400
    p = head(w, h, "Call stack of factorial(3)",
             "Frames for main, factorial(3), factorial(2) and factorial(1) stacked; each returns its value to the frame below.")
    p.append(text(190, 30, "Stack at the deepest call", 15, bold=True))
    p.append(text(520, 30, "Unwinding (pop)", 15, bold=True))
    fx, fw, fh, gap = 60, 260, 56, 14
    frames = [
        ("factorial(1)", "n=1 &#8594; base case", BLUE),
        ("factorial(2)", "n=2 waits on 2 * factorial(1)", BOX),
        ("factorial(3)", "n=3 waits on 3 * factorial(2)", BOX),
        ("main()", "waits on factorial(3)", BOX),
    ]
    rets = ["returns 1", "returns 2 * 1 = 2", "returns 3 * 2 = 6", "prints 6"]
    rx, rw = 420, 200
    top = 56
    for i, ((name, sub, fill), r) in enumerate(zip(frames, rets)):
        y = top + i * (fh + gap)
        dark = fill == BLUE
        p.append(box(fx, y, fw, fh, fill=fill, stroke=fill if dark else EDGE))
        p.append(text(fx + fw / 2, y + 23, name, 15, DARK if dark else TXT, bold=True, mono=True))
        p.append(text(fx + fw / 2, y + 43, sub, 12, DARK if dark else SUB))
        p.append(box(rx, y + 8, rw, fh - 16))
        p.append(text(rx + rw / 2, y + fh / 2 + 5, r, 13, mono=True))
        if i < len(frames) - 1:
            # value flows DOWN the stack as frames pop
            p += arrow([(rx + rw / 2, y + fh - 8), (rx + rw / 2, y + fh + gap + 6)])
    # push arrow on the left
    bottom = top + 3 * (fh + gap) + fh
    p += arrow([(36, bottom), (36, top)])
    p.append(f'<text x="24" y="{(top + bottom) / 2}" {FONT} font-size="12" fill="{SUB}" text-anchor="middle" '
             f'transform="rotate(-90 24 {(top + bottom) / 2})">calls push frames</text>')
    p.append(text(370, top + fh / 2 - 6, "pop", 12, SUB))
    p += arrow([(fx + fw, top + fh / 2), (rx - 2, top + fh / 2)])
    p.append(text(w / 2, h - 20, "Each frame keeps its own n; a frame resumes only after the call above it returns.", 13, SUB))
    save("dsa-call-stack.svg", p)


# ---------------------------------------------------------------- recursion tree
def recursion_tree():
    w, h = 720, 440
    p = head(w, h, "Recursion tree of fib(5)",
             "fib(5) calls fib(4) and fib(3); fib(3) is computed twice and fib(2) three times, highlighted as repeated work.")
    p.append(text(w / 2, 28, "Naive fib(5): 15 calls, repeated subproblems in orange", 15, bold=True))

    # Build the tree, assign leaf slots left to right, parents at the midpoint.
    nodes, edges, leaf = [], [], [0]

    def build(n, depth):
        idx = len(nodes)
        nodes.append({"n": n, "d": depth, "x": 0})
        if n >= 2:
            a = build(n - 1, depth + 1)
            b = build(n - 2, depth + 1)
            edges.extend([(idx, a), (idx, b)])
            nodes[idx]["x"] = (nodes[a]["x"] + nodes[b]["x"]) / 2
        else:
            nodes[idx]["x"] = leaf[0]
            leaf[0] += 1
        return idx

    build(5, 0)
    slots = leaf[0]
    left, right = 50, w - 50
    nw, nh = 64, 32
    for nd in nodes:
        nd["px"] = left + (right - left) * nd["x"] / (slots - 1)
        nd["py"] = 60 + nd["d"] * 76
    for a, b in edges:
        A, B = nodes[a], nodes[b]
        p.append(f'<line x1="{A["px"]:.1f}" y1="{A["py"] + nh:.1f}" x2="{B["px"]:.1f}" y2="{B["py"]:.1f}" '
                 f'stroke="{EDGE}" stroke-width="1.5"/>')
    seen = set()
    for nd in nodes:  # pre-order = execution order, so the first visit is the "original"
        n = nd["n"]
        repeat = n >= 2 and n in seen
        seen.add(n)
        if repeat:
            fill, stroke, col = ORANGE, ORANGE, DARK
        elif n < 2:
            fill, stroke, col = BOX, GREEN, TXT
        else:
            fill, stroke, col = BOX, EDGE, TXT
        p.append(box(nd["px"] - nw / 2, nd["py"], nw, nh, fill, stroke, rx=6))
        p.append(text(nd["px"], nd["py"] + 21, f"fib({n})", 13, col, mono=True))
    # legend
    ly = h - 26
    p.append(box(120, ly - 14, 18, 18, ORANGE, ORANGE, 3))
    p.append(text(146, ly, "recomputed subproblem", 12, SUB, "start"))
    p.append(box(330, ly - 14, 18, 18, BOX, GREEN, 3))
    p.append(text(356, ly, "base case fib(1), fib(0)", 12, SUB, "start"))
    save("dsa-recursion-tree.svg", p)


# ---------------------------------------------------------------- slice header
def slice_header():
    w, h = 680, 380
    p = head(w, h, "Go slice header and backing array",
             "Slice s points at index 0 with len 5 cap 5; slice t = s[1:3] points at index 1 with len 2 cap 4; both share one array.")
    p.append(text(w / 2, 28, "t := s[1:3] shares s's backing array", 15, bold=True, mono=True))
    hw, rh = 200, 30
    headers = [(80, "s", ["ptr", "len = 5", "cap = 5"], 0), (400, "t", ["ptr", "len = 2", "cap = 4"], 1)]
    cx0, cw, cg, cy = 70, 96, 12, 250
    cell_x = [cx0 + i * (cw + cg) for i in range(5)]
    for x, name, rows, target in headers:
        p.append(text(x + hw / 2, 58, f"slice header {name}", 13, SUB))
        for i, r in enumerate(rows):
            p.append(box(x, 68 + i * (rh + 4), hw, rh, rx=4))
            p.append(text(x + hw / 2, 68 + i * (rh + 4) + 20, r, 13, mono=True))
        # pointer arrow leaves the ptr row on its LEFT side and routes around
        # the header, so it never crosses the len/cap rows
        sx, sy = x, 68 + rh / 2
        tx = cell_x[target] + cw / 2
        p += arrow([(sx, sy), (x - 22, sy), (x - 22, 214), (tx, 214), (tx, cy - 2)])
    p.append(text(cell_x[2] + cw / 2, cy - 10, "backing array", 12, SUB))
    values = ["1", "99", "3", "4", "5"]
    for i, (x, v) in enumerate(zip(cell_x, values)):
        hl = i == 1
        p.append(box(x, cy, cw, 44, ORANGE if hl else BOX, ORANGE if hl else EDGE, 4))
        p.append(text(x + cw / 2, cy + 28, v, 16, DARK if hl else TXT, bold=hl, mono=True))
        p.append(text(x + cw / 2, cy + 62, f"[{i}]", 12, SUB, mono=True))

    def bracket(x1, x2, y, label):
        return [f'<polyline points="{x1},{y - 6} {x1},{y} {x2},{y} {x2},{y - 6}" fill="none" stroke="{BLUE}" stroke-width="2"/>',
                text((x1 + x2) / 2, y + 16, label, 12, TXT, mono=True)]

    p += bracket(cell_x[1], cell_x[2] + cw, 326, "len(t) = 2")
    p += bracket(cell_x[1], cell_x[4] + cw, 356, "cap(t) = 4")
    p.append(text(cell_x[4] + cw, cy - 10, "t[0] = 99 changed s[1]", 12, ORANGE, "end"))
    save("dsa-slice-header.svg", p)


# ---------------------------------------------------------------- growth chart
def growth_rates():
    import math
    w, h = 680, 420
    x0, x1, y0, y1 = 70, 560, 360, 40  # plot box, y0 = bottom edge
    nx, ny = 20, 100                   # axis ranges: n in [0,20], ops in [0,100]

    def px(n):
        return x0 + (x1 - x0) * n / nx

    def py(v):
        return y0 - (y0 - y1) * min(v, ny) / ny

    curves = [
        ("O(1)", lambda n: 1, SUB),
        ("O(log n)", lambda n: math.log2(n) if n >= 1 else 0, TXT),
        ("O(n)", lambda n: n, GREEN),
        ("O(n log n)", lambda n: n * math.log2(n) if n >= 1 else 0, BLUE),
        ("O(n²)", lambda n: n * n, ORANGE),
        ("O(2ⁿ)", lambda n: 2 ** n, RED),
    ]
    p = head(w, h, "Growth of common complexity classes",
             "Operations versus input size n for O(1), O(log n), O(n), O(n log n), O(n squared) and O(2 to the n). "
             "Exponential and quadratic curves leave the chart almost immediately.")
    p.append(f'<rect x="{x0}" y="{y1}" width="{x1 - x0}" height="{y0 - y1}" fill="{BOX}" stroke="#334155"/>')
    p.append(f'<defs><clipPath id="plot"><rect x="{x0}" y="{y1}" width="{x1 - x0}" height="{y0 - y1}"/></clipPath></defs>')
    for v in range(0, 101, 20):
        y = py(v)
        p.append(f'<line x1="{x0}" y1="{y:.1f}" x2="{x1}" y2="{y:.1f}" stroke="#334155" stroke-width="1"/>')
        p.append(text(x0 - 8, f"{y + 4:.1f}", v, 12, SUB, "end", mono=True))
    for n in range(0, 21, 5):
        x = px(n)
        p.append(f'<line x1="{x:.1f}" y1="{y0}" x2="{x:.1f}" y2="{y1}" stroke="#334155" stroke-width="1"/>')
        p.append(text(f"{x:.1f}", y0 + 18, n, 12, SUB, mono=True))
    p.append(text((x0 + x1) / 2, y0 + 40, "input size n", 14))
    p.append(f'<text x="22" y="{(y0 + y1) / 2}" {FONT} font-size="14" fill="{TXT}" text-anchor="middle" '
             f'transform="rotate(-90 22 {(y0 + y1) / 2})">operations</text>')
    p.append('<g clip-path="url(#plot)">')
    for _, f, c in curves:
        pts = []
        for i in range(401):
            n = nx * i / 400
            pts.append(f"{px(n):.1f},{y0 - (y0 - y1) * min(f(n), ny * 1.05) / ny:.1f}")
        p.append(f'<polyline points="{" ".join(pts)}" fill="none" stroke="{c}" stroke-width="3"/>')
    p.append("</g>")
    lx, ly = 578, 60
    p.append(f'<rect x="{lx - 8}" y="{ly - 22}" width="104" height="{len(curves) * 28 + 14}" rx="6" fill="{BOX}" stroke="#334155"/>')
    for i, (name, _, c) in enumerate(reversed(curves)):
        y = ly + i * 28
        p.append(f'<rect x="{lx}" y="{y - 8}" width="18" height="6" fill="{c}"/>')
        p.append(text(lx + 26, y, name, 13, TXT, "start", mono=True))
    p.append(text(x0, 26, "How work grows with n", 15, TXT, "start", bold=True))
    save("dsa-growth-rates.svg", p)


# ================================================================ Phase 2
def cells(xs, y, w, h, values, styles=None, size=16):
    """Row of array cells; styles maps index -> (fill, stroke, text colour)."""
    out = []
    for i, (x, v) in enumerate(zip(xs, values)):
        fill, stroke, col = (styles or {}).get(i, (BOX, EDGE, TXT))
        out.append(box(x, y, w, h, fill, stroke, 4))
        out.append(text(x + w / 2, y + h / 2 + 6, v, size, col, mono=True))
    return out


def row_x(n, w, gap, total):
    start = (total - (n * w + (n - 1) * gap)) / 2
    return [start + i * (w + gap) for i in range(n)]


def node(cx, y, label, w=56, h=34, fill=BOX, stroke=EDGE, col=TXT):
    return [box(cx - w / 2, y, w, h, fill, stroke, 6), text(cx, y + h / 2 + 5, label, 14, col, mono=True)]


def edge(x1, y1, x2, y2, color=EDGE, width=1.5):
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="{width}"/>'


HL_BLUE = (BLUE, BLUE, DARK)
HL_ORANGE = (ORANGE, ORANGE, DARK)
HL_RED = (RED, RED, DARK)
MUTED = (BOX, "#334155", "#64748b")


def two_pointers():
    w, h = 680, 380
    p = head(w, h, "Two pointers and sliding window",
             "Top: lo and hi pointers move toward each other over a sorted array. Bottom: a window of three cells slides right; one element enters and one leaves.")
    p.append(text(w / 2, 28, "Two pointers and sliding window", 16, bold=True))
    cw, gap = 64, 10
    xs = row_x(8, cw, gap, w)
    # --- opposite ends
    p.append(text(xs[0], 62, "Opposite ends on sorted data: sum too small → lo++, too large → hi--", 13, SUB, "start"))
    styles = {0: MUTED, 7: MUTED, 1: HL_BLUE, 6: HL_BLUE}
    p += cells(xs, 76, cw, 44, [1, 3, 4, 6, 8, 11, 13, 15], styles)
    for i, lab in ((1, "lo → moves right"), (6, "hi ← moves left")):
        cx = xs[i] + cw / 2
        p += arrow([(cx, 158), (cx, 124)])
        p.append(text(cx, 176, lab, 12, TXT))
    p.append(text(xs[0] + cw / 2, 140, "discarded", 11, "#64748b"))
    p.append(text(xs[7] + cw / 2, 140, "discarded", 11, "#64748b"))
    # --- sliding window
    p.append(text(xs[0], 214, "Sliding window: add the element that enters, subtract the one that leaves", 13, SUB, "start"))
    styles = {2: HL_RED, 3: HL_ORANGE, 4: HL_ORANGE, 5: (BOX, GREEN, TXT)}
    p += cells(xs, 228, cw, 44, [2, 1, 5, 1, 3, 2, 9, 7], styles)
    for i, lab in ((2, "leaves (left)"), (5, "enters (right)")):
        cx = xs[i] + cw / 2
        p += arrow([(cx, 310), (cx, 276)])
        p.append(text(cx, 328, lab, 12, TXT))
    p.append(text(w / 2, 362, "window [5 1 3] sum 9  →  next window [1 3 2] sum 9 - 5 + 2 = 6", 13, TXT, mono=True))
    save("dsa-two-pointers.svg", p)


def list_node(p, x, y, val, fill=BOX, stroke=EDGE, col=TXT):
    """A 90x44 node: value part (60) and next-pointer part (30)."""
    p.append(box(x, y, 90, 44, fill, stroke, 4))
    p.append(edge(x + 60, y, x + 60, y + 44, stroke if fill != BOX else EDGE))
    p.append(text(x + 30, y + 28, val, 16, col, mono=True))
    p.append(f'<circle cx="{x + 75}" cy="{y + 22}" r="4" fill="{col if fill != BOX else SUB}"/>')


def linked_list():
    w, h = 680, 360
    p = head(w, h, "Singly linked list and node removal",
             "Top: head points to a, a to b, b to c, c to nil; tail points to c. Bottom: removing c by pointing b.next at d.")
    p.append(text(w / 2, 28, "Singly linked list with head and tail", 16, bold=True))
    xs = [60, 210, 360, 510]
    y = 96
    for x, v in zip(xs[:3], "abc"):
        list_node(p, x, y, v)
    for a, b in zip(xs, xs[1:3]):
        p += arrow([(a + 75, y + 22), (b - 2, y + 22)])
    p += arrow([(xs[2] + 75, y + 22), (xs[3] - 2, y + 22)])
    p.append(text(xs[3] + 20, y + 28, "nil", 15, SUB, "start", mono=True))
    for x, lab in ((xs[0], "head"), (xs[2], "tail")):
        p.append(text(x + 45, 64, lab, 13, TXT, mono=True))
        p += arrow([(x + 45, 70), (x + 45, y - 2)])
    # --- removal
    p.append(text(w / 2, 188, "Remove c: prev.next = victim.next — O(1) once prev is known", 14, bold=True))
    y2 = 226
    styles = {2: (RED, RED, DARK)}
    for i, (x, v) in enumerate(zip(xs, "abcd")):
        f, s, c = styles.get(i, (BOX, EDGE, TXT))
        list_node(p, x, y2, v, f, s, c)
    p += arrow([(xs[0] + 75, y2 + 22), (xs[1] - 2, y2 + 22)])
    p += arrow([(xs[2] + 75, y2 + 22), (xs[3] - 2, y2 + 22)])
    p += arrow([(xs[1] + 75, y2 + 44), (xs[1] + 75, y2 + 80), (xs[3] + 30, y2 + 80), (xs[3] + 30, y2 + 46)],
               "b.next now skips c", xs[2] + 45, y2 + 98, "middle")
    p.append(text(xs[1] + 45, y2 - 12, "prev", 13, TXT, mono=True))
    p.append(text(xs[2] + 45, y2 - 12, "victim", 13, RED, mono=True))
    save("dsa-linked-list.svg", p)


def doubly_sentinel():
    w, h = 680, 290
    p = head(w, h, "Doubly linked list with a sentinel",
             "A sentinel node and nodes A, B, C linked in both directions, closing into a ring through the sentinel.")
    p.append(text(w / 2, 28, "Doubly linked ring with one sentinel node", 16, bold=True))
    bw, bh, y = 110, 52, 112
    xs = [40, 200, 360, 520]
    labels = ["sentinel", "A", "B", "C"]
    for i, (x, lab) in enumerate(zip(xs, labels)):
        if i == 0:
            p.append(box(x, y, bw, bh, ORANGE, ORANGE, 6))
            p.append(text(x + bw / 2, y + 32, lab, 15, DARK, bold=True, mono=True))
        else:
            p.append(box(x, y, bw, bh, BOX, EDGE, 6))
            p.append(text(x + bw / 2, y + 32, lab, 16, TXT, mono=True))
    for a, b in zip(xs, xs[1:]):
        p += arrow([(a + bw, y + 16), (b - 2, y + 16)])          # next
        p += arrow([(b, y + 36), (a + bw + 2, y + 36)])          # prev
    p.append(text((xs[0] + bw + xs[1]) / 2, y + 10, "next", 11, SUB))
    p.append(text((xs[0] + bw + xs[1]) / 2, y + 52, "prev", 11, SUB))
    last, first = xs[3] + bw / 2, xs[0] + bw / 2
    p += arrow([(last, y + bh), (last, 206), (first, 206), (first, y + bh + 2)], "C.next = sentinel", w / 2, 224, "middle")
    p += arrow([(first, y), (first, 72), (last, 72), (last, y - 2)], "sentinel.prev = C (the last node)", w / 2, 64, "middle")
    p.append(text(w / 2, 268, "Empty list: sentinel.next = sentinel.prev = sentinel — no nil checks anywhere", 13, TXT))
    save("dsa-doubly-sentinel.svg", p)


def ring_buffer():
    w, h = 680, 300
    p = head(w, h, "Ring buffer queue",
             "Eight slots; elements a and b in slots 6 and 7, c and d wrapped into slots 0 and 1. head is 6 and tail is 2.")
    p.append(text(w / 2, 28, "Ring buffer: head = 6, size = 4, capacity 8", 16, bold=True, mono=True))
    cw, gap = 64, 10
    xs = row_x(8, cw, gap, w)
    vals = ["c", "d", "", "", "", "", "a", "b"]
    styles = {i: HL_BLUE for i in (0, 1, 6, 7)}
    y = 110
    p += cells(xs, y, cw, 48, vals, styles)
    for i, x in enumerate(xs):
        p.append(text(x + cw / 2, y + 68, f"[{i}]", 12, SUB, mono=True))
    x7, x0 = xs[7] + cw / 2, xs[0] + cw / 2
    p += arrow([(x7, y), (x7, 80), (x0, 80), (x0, y - 2)], "index wraps: (i + 1) % 8", w / 2, 72, "middle")
    for i, lab in ((6, "head = 6 (oldest)"), (2, "tail = (head + size) % 8 = 2")):
        cx = xs[i] + cw / 2
        p += arrow([(cx, 232), (cx, y + 76)])
        p.append(text(cx, 250, lab, 12, TXT))
    p.append(text(w / 2, 284, "queue order, oldest first: a, b, c, d — PopFront reads head, PushBack writes tail", 13, SUB))
    save("dsa-ring-buffer.svg", p)


def hash_chaining():
    w, h = 680, 400
    p = head(w, h, "Hash table with separate chaining",
             "Eight buckets. apple and cherry both hash to bucket 3 and share a chain; banana and fig share bucket 1; date is alone in bucket 6.")
    p.append(text(w / 2, 28, "Separate chaining: bucket = hash(key) % 8", 16, bold=True, mono=True))
    # left panel: key -> bucket
    p.append(box(20, 60, 170, 190, BOX, EDGE, 8))
    p.append(text(105, 84, "hash(key) % 8", 13, SUB, mono=True))
    for i, (k, b) in enumerate((("apple", 3), ("banana", 1), ("cherry", 3), ("date", 6), ("fig", 1))):
        col = ORANGE if k in ("cherry", "fig") else TXT
        p.append(text(40, 116 + i * 28, f"{k:<7}→ {b}", 13, col, "start", mono=True))
    p.append(text(105, 276, "orange = collision", 12, ORANGE))
    bx, bw, bh, gap = 230, 70, 32, 8
    chains = {1: ["banana", "fig"], 3: ["apple", "cherry"], 6: ["date"]}
    for i in range(8):
        y = 56 + i * (bh + gap)
        p.append(box(bx, y, bw, bh, BOX, EDGE, 4))
        p.append(text(bx + bw / 2, y + 21, f"[{i}]", 13, SUB, mono=True))
        prev_x = bx + bw
        for j, k in enumerate(chains.get(i, [])):
            ex = 340 + j * 150
            coll = j > 0
            p += arrow([(prev_x, y + bh / 2), (ex - 2, y + bh / 2)])
            p.append(box(ex, y, 120, bh, ORANGE if coll else BOX, ORANGE if coll else EDGE, 4))
            p.append(text(ex + 60, y + 21, k, 13, DARK if coll else TXT, mono=True))
            prev_x = ex + 120
    p.append(text(w / 2, 390, "load factor = 5 entries / 8 buckets = 0.625 — resize (double) when it exceeds 0.75", 13, SUB))
    save("dsa-hash-chaining.svg", p)


def bst():
    w, h = 680, 380
    p = head(w, h, "Binary search tree search path",
             "BST with root 8. Searching for 7 visits 8, 3, 6, 7: smaller goes left, larger goes right.")
    p.append(text(w / 2, 28, "Search for 7: one comparison per level, O(h)", 16, bold=True))
    pos = {8: (340, 56), 3: (190, 136), 10: (490, 136), 1: (110, 216), 6: (270, 216),
           14: (570, 216), 4: (220, 296), 7: (320, 296), 13: (520, 296)}
    edges = [(8, 3), (8, 10), (3, 1), (3, 6), (10, 14), (6, 4), (6, 7), (14, 13)]
    path = {8, 3, 6, 7}
    for a, b in edges:
        on = a in path and b in path
        (x1, y1), (x2, y2) = pos[a], pos[b]
        p.append(edge(x1, y1 + 34, x2, y2, BLUE if on else EDGE, 3 if on else 1.5))
    for k, (x, y) in pos.items():
        if k in path:
            p += node(x, y, k, fill=BLUE, stroke=BLUE, col=DARK)
        else:
            p += node(x, y, k)
    p.append(text(236, 104, "7 &lt; 8 → left", 12, TXT, "end"))
    p.append(text(250, 184, "7 &gt; 3 → right", 12, TXT, "start"))
    p.append(text(310, 262, "7 &gt; 6 → right", 12, TXT, "start"))
    p.append(text(w / 2, 362, "in-order traversal: 1 3 4 6 7 8 10 13 14 — always sorted", 13, SUB, mono=True))
    save("dsa-bst.svg", p)


def heap_array():
    w, h = 680, 390
    p = head(w, h, "Binary heap stored in an array",
             "Min-heap 1, 3, 2, 7, 4, 5 drawn as a tree and as a slice. Node 3 at index 1 has children at indices 3 and 4.")
    p.append(text(w / 2, 28, "Min-heap: the tree lives inside a slice", 16, bold=True))
    vals = [1, 3, 2, 7, 4, 5]
    pos = [(340, 50), (220, 120), (460, 120), (160, 190), (280, 190), (400, 190)]
    styles = {1: HL_BLUE, 3: HL_ORANGE, 4: HL_ORANGE}
    for c in range(1, 6):
        (x1, y1), (x2, y2) = pos[(c - 1) // 2], pos[c]
        p.append(edge(x1, y1 + 34, x2, y2))
    for i, ((x, y), v) in enumerate(zip(pos, vals)):
        f, s, col = styles.get(i, (BOX, EDGE, TXT))
        p += node(x, y, v, fill=f, stroke=s, col=col)
        p.append(text(x + 34, y + 30, f"[{i}]", 11, SUB, "start", mono=True))
    xs = row_x(6, 70, 10, w)
    p += cells(xs, 268, 70, 44, vals, styles)
    for i, x in enumerate(xs):
        p.append(text(x + 35, 330, f"[{i}]", 12, SUB, mono=True))
    p.append(text(w / 2, 254, "same data, level by level:", 12, SUB))
    p.append(text(w / 2, 368, "parent(i) = (i-1)/2 · left(i) = 2i+1 · right(i) = 2i+2", 14, TXT, mono=True))
    save("dsa-heap-array.svg", p)


# ================================================================ Phase 3
HL_GREEN = (GREEN, GREEN, DARK)


def binary_search():
    w, h = 760, 440
    vals = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]
    p = head(w, h, "Binary search for 40",
             "Ten sorted values. Each step compares the middle element and discards half of the range until the range is empty.")
    p.append(text(w / 2, 28, "Binary search for 40: each comparison halves [lo, hi)", 16, bold=True))
    cw, gap = 46, 6
    xs = [76 + i * (cw + gap) for i in range(10)]
    for i, x in enumerate(xs):
        p.append(text(x + cw / 2, 58, f"[{i}]", 11, SUB, mono=True))
    steps = [(0, 10, 5, "23 &lt; 40 → lo = 6"), (6, 10, 8, "72 &gt; 40 → hi = 8"),
             (6, 8, 7, "56 &gt; 40 → hi = 7"), (6, 7, 6, "38 &lt; 40 → lo = 7")]
    y = 68
    for k, (lo, hi, mid, note) in enumerate(steps):
        styles = {i: MUTED for i in range(10) if not lo <= i < hi}
        styles[mid] = HL_ORANGE
        p.append(text(16, y + 26, f"step {k + 1}", 13, SUB, "start"))
        p += cells(xs, y, cw, 40, vals, styles, 15)
        p.append(text(xs[mid] + cw / 2, y + 56, "mid", 11, ORANGE))
        p.append(text(w - 16, y + 26, note, 12, TXT, "end"))
        y += 72
    styles = {i: MUTED for i in range(10)}
    p.append(text(16, y + 26, "end", 13, SUB, "start"))
    p += cells(xs, y, cw, 40, vals, styles, 15)
    p.append(text(w - 16, y + 26, "lo = hi = 7", 12, TXT, "end"))
    p.append(text(w - 16, y + 44, "empty: not found", 12, TXT, "end"))
    p.append(text(w / 2, h - 14, "10 elements: at most 4 comparisons · 1,000,000 elements: at most 20", 13, SUB))
    save("dsa-binary-search.svg", p)


def merge_sort():
    w, h = 720, 470
    p = head(w, h, "Merge sort on eight values",
             "The slice 5 2 4 7 1 3 2 6 is split into halves down to single elements, then merged back in sorted order.")
    p.append(text(w / 2, 28, "Merge sort: split down, merge up", 16, bold=True))
    cw, gap, ch = 40, 4, 32

    def row(y, groups, style):
        total = sum(len(g) * cw + (len(g) - 1) * gap for g in groups) + 24 * (len(groups) - 1)
        x = (w - total) / 2
        centers = []
        for g in groups:
            gw = len(g) * cw + (len(g) - 1) * gap
            p.extend(cells([x + i * (cw + gap) for i in range(len(g))], y, cw, ch, g,
                           {i: style for i in range(len(g))}, 15))
            centers.append(x + gw / 2)
            x += gw + 24
        return centers

    plain = (BOX, EDGE, TXT)
    split = [[[5, 2, 4, 7, 1, 3, 2, 6]], [[5, 2, 4, 7], [1, 3, 2, 6]],
             [[5, 2], [4, 7], [1, 3], [2, 6]], [[5], [2], [4], [7], [1], [3], [2], [6]]]
    merged = [[[2, 5], [4, 7], [1, 3], [2, 6]], [[2, 4, 5, 7], [1, 2, 3, 6]], [[1, 2, 2, 3, 4, 5, 6, 7]]]
    y, prev = 50, None
    for k, groups in enumerate(split):
        c = row(y, groups, HL_BLUE if k == 3 else plain)
        if prev:
            for i, cx in enumerate(c):
                p.append(edge(prev[i // 2], y - 22, cx, y, EDGE))
        prev = c
        y += 54
    for k, groups in enumerate(merged):
        c = row(y, groups, HL_GREEN if k == 2 else plain)
        for i, cx in enumerate(c):
            p.append(edge(prev[2 * i], y - 22, cx, y, GREEN))
            p.append(edge(prev[2 * i + 1], y - 22, cx, y, GREEN))
        prev = c
        y += 54
    p.append(text(16, 124, "split", 13, SUB, "start"))
    p.append(text(16, 340, "merge", 13, GREEN, "start"))
    p.append(text(w / 2, h - 14, "log2(8) = 3 merge levels · each level touches all n elements → O(n log n)", 13, SUB))
    save("dsa-merge-sort.svg", p)


def partition():
    w, h = 720, 340
    p = head(w, h, "Lomuto partition around pivot 5",
             "Middle of the partition: elements smaller than 5, elements at least 5, unexamined elements, and the pivot. Final state: pivot in its sorted position.")
    p.append(text(w / 2, 28, "Partitioning [7 2 9 4 3 8 5] around the last element, 5", 16, bold=True))
    cw, gap = 64, 8
    xs = row_x(7, cw, gap, w)
    p.append(text(xs[0], 64, "During the scan (i = 2, j = 4):", 13, SUB, "start"))
    styles = {0: HL_BLUE, 1: HL_BLUE, 2: HL_ORANGE, 3: HL_ORANGE, 6: HL_RED}
    p += cells(xs, 76, cw, 44, [2, 4, 9, 7, 3, 8, 5], styles)
    for i, lab in ((2, "i"), (4, "j")):
        cx = xs[i] + cw / 2
        p += arrow([(cx, 152), (cx, 124)])
        p.append(text(cx, 168, lab, 13, TXT, mono=True))
    legend = [(xs[0], BLUE, "&lt; pivot"), (xs[2], ORANGE, "≥ pivot"), (xs[4], SUB, "not examined"), (xs[6], RED, "pivot")]
    for x, c, lab in legend:
        p.append(text(x, 196, lab, 12, c, "start"))
    p.append(text(xs[0], 236, "After the final swap (pivot at index 3):", 13, SUB, "start"))
    styles = {0: HL_BLUE, 1: HL_BLUE, 2: HL_BLUE, 3: HL_RED, 4: HL_ORANGE, 5: HL_ORANGE, 6: HL_ORANGE}
    p += cells(xs, 248, cw, 44, [2, 4, 3, 5, 9, 8, 7], styles)
    p.append(text(w / 2, 322, "5 is in its final place; sort [2 4 3] and [9 8 7] independently", 13, SUB))
    save("dsa-partition.svg", p)


def vertex(cx, cy, label, style=None, r=20):
    fill, stroke, col = style or (BOX, EDGE, TXT)
    return [f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}" stroke="{stroke}" stroke-width="1.5"/>',
            text(cx, cy + 5, label, 14, col, bold=True)]


def weight_label(x1, y1, x2, y2, wt, dx=0, dy=-6, col=TXT):
    return text((x1 + x2) / 2 + dx, (y1 + y2) / 2 + dy, wt, 13, col, bold=True)


def graph_representations():
    w, h = 740, 340
    p = head(w, h, "Three graph representations",
             "The same weighted undirected graph with vertices A to E, drawn, stored as adjacency lists, and stored as an adjacency matrix.")
    p.append(text(w / 2, 28, "One graph, three representations", 16, bold=True))
    pos = {"A": (50, 110), "B": (200, 90), "C": (80, 250), "D": (230, 230), "E": (300, 310)}
    edges = [("A", "B", 4, 0, -8), ("A", "C", 1, -12, 0), ("C", "B", 2, 12, 4), ("B", "D", 5, 12, 0),
             ("C", "D", 8, 0, 18), ("D", "E", 3, 14, 0)]
    for a, b, wt, dx, dy in edges:
        (x1, y1), (x2, y2) = pos[a], pos[b]
        p.append(edge(x1, y1, x2, y2, EDGE, 2))
        p.append(weight_label(x1, y1, x2, y2, wt, dx, dy))
    for k, (x, y) in pos.items():
        p += vertex(x, y, k)
    p.append(text(170, 58, "graph", 13, SUB))
    lx = 350
    p.append(text(lx + 100, 58, "adjacency list  O(V+E)", 13, SUB))
    adj = {"A": ["B4", "C1"], "B": ["A4", "C2", "D5"], "C": ["A1", "B2", "D8"], "D": ["B5", "C8", "E3"], "E": ["D3"]}
    for i, (k, ns) in enumerate(adj.items()):
        y = 76 + i * 48
        p.append(box(lx, y, 34, 34, BLUE, BLUE, 4))
        p.append(text(lx + 17, y + 23, k, 14, DARK, bold=True))
        p += arrow([(lx + 34, y + 17), (lx + 50, y + 17)])
        for j, nb in enumerate(ns):
            x = lx + 54 + j * 44
            p.append(box(x, y, 40, 34, BOX, EDGE, 4))
            p.append(text(x + 20, y + 22, nb, 13, TXT, mono=True))
    mx, cs = 540, 30
    names = "ABCDE"
    m = {("A", "B"): 4, ("A", "C"): 1, ("B", "C"): 2, ("B", "D"): 5, ("C", "D"): 8, ("D", "E"): 3}
    p.append(text(mx + 90, 58, "matrix  O(V²)", 13, SUB))
    for i, r in enumerate(names):
        p.append(text(mx + 15 + (i + 1) * cs, 88, r, 12, SUB, bold=True))
        p.append(text(mx + 15, 114 + i * cs, r, 12, SUB, bold=True))
        for j, c in enumerate(names):
            v = m.get((r, c)) or m.get((c, r))
            x, y = mx + (j + 1) * cs, 94 + i * cs
            p.append(box(x, y, cs, cs, ORANGE if v else BOX, ORANGE if v else EDGE, 2))
            p.append(text(x + cs / 2, y + 20, v or 0, 13, DARK if v else "#64748b", mono=True))
    p.append(text(mx + 105, 270, "symmetric (undirected)", 12, SUB))
    p.append(text(mx + 105, 288, "13 of 25 cells are 0", 12, SUB))
    save("dsa-graph-representations.svg", p)


def bfs_dfs():
    w, h = 720, 380
    p = head(w, h, "BFS order versus DFS order",
             "The same graph explored from A. BFS visits by distance level: A, B, C, D, E, F, G. DFS goes deep first: A, B, D, G, E, C, F.")
    p.append(text(w / 2, 28, "Same graph, different visiting order", 16, bold=True))
    base = {"A": (0, 92), "B": (-70, 170), "C": (70, 170), "D": (-110, 248), "E": (0, 248), "F": (110, 248), "G": (-110, 326)}
    es = [("A", "B"), ("A", "C"), ("B", "D"), ("B", "E"), ("C", "E"), ("C", "F"), ("D", "G")]
    panels = [(220, "BFS: queue, level by level", "ABCDEFG", {("A", "B"), ("A", "C"), ("B", "D"), ("B", "E"), ("C", "F"), ("D", "G")}),
              (540, "DFS: stack, deep first", "ABDGECF", {("A", "B"), ("B", "D"), ("D", "G"), ("B", "E"), ("C", "E"), ("C", "F")})]
    for ox, title, order, tree in panels:
        p.append(text(ox, 52, title, 14, TXT, bold=True))
        for a, b in es:
            (x1, y1), (x2, y2) = base[a], base[b]
            on = (a, b) in tree
            line = edge(ox + x1, y1, ox + x2, y2, BLUE if on else EDGE, 3 if on else 1.5)
            if not on:
                line = line.replace("/>", ' stroke-dasharray="5 4"/>')
            p.append(line)
        for k, (x, y) in base.items():
            p += vertex(ox + x, y, k)
            n = order.index(k) + 1
            p.append(f'<circle cx="{ox + x + 20}" cy="{y - 17}" r="10" fill="{ORANGE}"/>')
            p.append(text(ox + x + 20, y - 13, n, 11, DARK, bold=True))
    for lvl, y in enumerate((92, 170, 248, 326)):
        p.append(text(16, y + 4, f"distance {lvl}", 11, SUB, "start"))
    p.append(text(w / 2, h - 8, "orange badge = visit order · blue = edge that discovered the vertex · dashed = not used", 12, SUB))
    save("dsa-bfs-dfs.svg", p)


def topo_sort():
    w, h = 720, 330
    p = head(w, h, "Topological order of build steps",
             "A directed acyclic graph of build steps and one valid topological order produced by Kahn's algorithm.")
    p.append(text(w / 2, 28, "Dependencies (DAG) and a topological order", 16, bold=True))
    bw, bh = 96, 36
    pos = {"fetch": (20, 100), "configure": (160, 60), "docs": (160, 150), "compile": (300, 60),
           "test": (440, 40), "package": (440, 110), "release": (590, 110)}
    deps = [("fetch", "configure"), ("fetch", "docs"), ("configure", "compile"), ("compile", "test"),
            ("compile", "package"), ("test", "release"), ("package", "release"), ("docs", "release")]
    for a, b in deps:
        (x1, y1), (x2, y2) = pos[a], pos[b]
        if (a, b) == ("docs", "release"):  # route below package, into release from underneath
            p += arrow([(x1 + bw, y1 + bh / 2), (x2 + bw / 2, y1 + bh / 2), (x2 + bw / 2, y2 + bh + 2)])
        else:
            p += arrow([(x1 + bw, y1 + bh / 2), (x2 - 2, y2 + bh / 2)])
    for k, (x, y) in pos.items():
        style = HL_BLUE if k == "fetch" else (BOX, EDGE, TXT)
        p.append(box(x, y, bw, bh, style[0], style[1], 6))
        p.append(text(x + bw / 2, y + 23, k, 13, style[2], mono=True))
    p.append(text(20, 218, "blue: in-degree 0, can run first · an arrow a → b means a must come before b", 12, SUB, "start"))
    order = ["fetch", "configure", "docs", "compile", "test", "package", "release"]
    xs = row_x(7, 92, 6, w)
    p.append(text(xs[0], 250, "Kahn's order:", 13, SUB, "start"))
    p += cells(xs, 260, 92, 36, order, {i: HL_GREEN for i in range(7)}, 13)
    p.append(text(w / 2, 318, "every dependency arrow points left to right in this row", 12, SUB))
    save("dsa-topo-sort.svg", p)


def union_find():
    w, h = 720, 340
    p = head(w, h, "Union-find path compression",
             "Before: x points to b, b to a, a to the root r. After Find(x), x, b and a all point directly to r.")
    p.append(text(w / 2, 28, "Find(x) with path compression (arrows point to the parent)", 16, bold=True))

    def link(x1, y1, x2, y2, color=SUB):
        return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="2" marker-end="url(#arrow)"/>'

    root = (GREEN, GREEN, DARK)
    p.append(text(180, 60, "before: x is 3 steps from the root", 13, TXT, bold=True))
    chain = [("r", 180, 100), ("a", 180, 170), ("b", 180, 240), ("x", 180, 310)]
    for (_, x1, y1), (_, x2, y2) in zip(chain[1:], chain):
        p.append(link(x1, y1 - 20, x2, y2 + 22, BLUE))
    p.append(link(94, 156, 164, 112))
    p.append(link(266, 226, 196, 182))
    for n, x, y in chain:
        p += vertex(x, y, n, root if n == "r" else HL_BLUE)
    p += vertex(90, 170, "c")
    p += vertex(270, 240, "d")
    p.append(text(360, 200, "→", 36, SUB))
    p.append(text(550, 60, "after Find(x): the path points at r", 13, TXT, bold=True))
    p += vertex(550, 110, "r", root)
    for n, x in (("c", 430), ("a", 510), ("b", 590), ("x", 670)):
        on = n in "abx"
        tx = 550 + (x - 550) * 0.22
        p.append(link(x, 210, tx, 133, BLUE if on else SUB))
        p += vertex(x, 230, n, HL_BLUE if on else None)
    p += vertex(510, 310, "d")
    p.append(link(510, 290, 510, 253))
    save("dsa-union-find.svg", p)


def dijkstra():
    w, h = 720, 390
    p = head(w, h, "Dijkstra shortest paths from Home",
             "Weighted road graph. Final distances from Home: Park 2, Cafe 3, Mall 8, Work 11, Gym 12. Shortest-path tree edges are highlighted.")
    p.append(text(w / 2, 28, "Dijkstra from Home: final distances and shortest-path tree", 16, bold=True))
    pos = {"Home": (90, 200), "Park": (260, 120), "Cafe": (260, 290), "Mall": (450, 290),
           "Gym": (450, 120), "Work": (620, 200)}
    dist = {"Home": 0, "Park": 2, "Cafe": 3, "Mall": 8, "Work": 11, "Gym": 12}
    roads = [("Home", "Cafe", 4, 0, 18), ("Home", "Park", 2, 0, -10), ("Park", "Cafe", 1, 14, 4),
             ("Cafe", "Mall", 5, 0, 20), ("Park", "Mall", 8, 18, -2), ("Mall", "Work", 3, 10, 18),
             ("Park", "Gym", 10, 0, -10), ("Gym", "Work", 2, 10, -10)]
    tree = {("Home", "Park"), ("Park", "Cafe"), ("Cafe", "Mall"), ("Mall", "Work"), ("Park", "Gym")}
    for a, b, wt, dx, dy in roads:
        (x1, y1), (x2, y2) = pos[a], pos[b]
        on = (a, b) in tree
        p.append(edge(x1, y1, x2, y2, BLUE if on else EDGE, 3.5 if on else 1.5))
        p.append(weight_label(x1, y1, x2, y2, wt, dx, dy))
    for k, (x, y) in pos.items():
        style = (GREEN, GREEN, DARK) if k == "Home" else (BOX, BLUE, TXT)
        p.append(box(x - 40, y - 18, 80, 36, style[0], style[1], 18))
        p.append(text(x, y + 5, k, 13, style[2], bold=True))
        p.append(box(x - 17, y - 48, 34, 22, ORANGE, ORANGE, 4))
        p.append(text(x, y - 32, dist[k], 13, DARK, bold=True, mono=True))
    p.append(text(w / 2, 350, "orange = final distance · blue = shortest-path tree · finalized in order 0, 2, 3, 8, 11, 12", 12, SUB))
    p.append(text(w / 2, 372, "Cafe: Home → Park → Cafe = 3 beats the direct road (4)", 12, SUB))
    save("dsa-dijkstra.svg", p)


# ================================================================ Phase 4
def activity_selection():
    w, h = 720, 420
    meetings = [(1, 4), (3, 5), (0, 6), (5, 7), (3, 9), (5, 9), (6, 10), (8, 11), (8, 12), (2, 14), (12, 16)]
    p = head(w, h, "Activity selection by earliest end time",
             "Eleven meetings sorted by end time. Scanning top to bottom, a meeting is taken when it starts at or after "
             "the end of the last taken one: [1,4), [5,7), [8,11) and [12,16).")
    p.append(text(w / 2, 28, "Sorted by end time: take a meeting if it starts after the last one taken", 16, bold=True))
    x0, unit, y0, rh = 110, 32, 50, 27
    last = -1
    ends = []
    for k, (s0, e0) in enumerate(meetings):
        y = y0 + k * rh
        take = s0 >= last
        if take:
            last = e0
            ends.append(e0)
        fill, stroke, col = HL_GREEN if take else MUTED
        p.append(text(x0 - 14, y + 16, f"[{s0},{e0})", 12, TXT if take else SUB, "end", mono=True))
        p.append(box(x0 + s0 * unit, y + 3, (e0 - s0) * unit, 18, fill, stroke, 4))
        p.append(text(w - 30, y + 16, "take" if take else "skip", 12, GREEN if take else SUB, "end", bold=take))
    yb = y0 + len(meetings) * rh + 6
    for e0 in ends:
        x = x0 + e0 * unit
        p.append(f'<line x1="{x}" y1="{y0}" x2="{x}" y2="{yb}" stroke="{ORANGE}" stroke-width="1.2" stroke-dasharray="4 4"/>')
    p.append(edge(x0, yb, x0 + 16 * unit, yb, SUB))
    for t in range(0, 17, 2):
        x = x0 + t * unit
        p.append(edge(x, yb, x, yb + 5, SUB))
        p.append(text(x, yb + 20, t, 11, SUB, mono=True))
    p.append(text(w / 2, h - 14, "orange lines: end of each taken meeting · 4 meetings, the maximum possible", 12, SUB))
    save("dsa-activity-selection.svg", p)


def huffman():
    w, h = 740, 500
    p = head(w, h, "Huffman tree for abracadabra",
             "Frequencies a 5, b 2, r 2, c 1, d 1. Merges: c+d=2, b+cd=4, r+4=6, a+6=11. "
             "Codes: a 0, r 10, b 110, c 1110, d 1111; 23 bits instead of 33 with a 3-bit fixed code.")
    p.append(text(w / 2, 28, "Huffman tree for \"abracadabra\": merge the two lightest trees", 16, bold=True))
    inner = {"11": (360, 76), "6": (480, 156), "4": (560, 236), "2": (640, 316)}
    leaves = {"a": (220, 156, 5, "0"), "r": (400, 236, 2, "10"), "b": (480, 316, 2, "110"),
              "c": (580, 396, 1, "1110"), "d": (700, 396, 1, "1111")}
    links = [("11", "a", "0"), ("11", "6", "1"), ("6", "r", "0"), ("6", "4", "1"),
             ("4", "b", "0"), ("4", "2", "1"), ("2", "c", "0"), ("2", "d", "1")]
    pos = {**inner, **{k: v[:2] for k, v in leaves.items()}}
    for a, b, bit in links:
        (x1, y1), (x2, y2) = pos[a], pos[b]
        p.append(edge(x1, y1, x2, y2, EDGE, 2))
        dx = -12 if bit == "0" else 12
        p.append(text((x1 + x2) / 2 + dx, (y1 + y2) / 2 - 2, bit, 14, ORANGE, bold=True, mono=True))
    for k, (x, y) in inner.items():
        p += vertex(x, y, k, None, 22)
    for k, (x, y, f, code) in leaves.items():
        p.append(box(x - 30, y - 18, 60, 36, BLUE, BLUE, 6))
        p.append(text(x, y + 5, f"{k}:{f}", 14, DARK, bold=True, mono=True))
        p.append(text(x, y + 36, code, 13, GREEN, mono=True))
    p.append(text(40, 250, "merge order", 13, TXT, "start", bold=True))
    for i, m in enumerate(["1. c + d = 2", "2. b + (cd) = 4", "3. r + 4 = 6", "4. a + 6 = 11"]):
        p.append(text(40, 276 + i * 22, m, 12, SUB, "start", mono=True))
    p.append(text(w / 2, h - 36, "circles: merged trees with their total weight · blue: symbols with frequency · green: code", 12, SUB))
    p.append(text(w / 2, h - 14, "5·1 + 2·2 + 2·3 + 1·4 + 1·4 = 23 bits (fixed 3-bit code: 33)", 12, SUB))
    save("dsa-huffman.svg", p)


def edit_distance():
    a, b = "kitten", "sitting"
    # d[i][j] = edits to turn a[:i] into b[:j]
    d = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
    for i in range(len(a) + 1):
        d[i][0] = i
    for j in range(len(b) + 1):
        d[0][j] = j
    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            d[i][j] = d[i - 1][j - 1] if a[i - 1] == b[j - 1] else 1 + min(d[i - 1][j - 1], d[i - 1][j], d[i][j - 1])
    path = [(0, 0), (1, 1), (2, 2), (3, 3), (4, 4), (5, 5), (6, 6), (6, 7)]
    w, h = 640, 420
    p = head(w, h, "Edit distance table for kitten and sitting",
             "Table d[i][j] of edit distances between prefixes of kitten and sitting. The path from the top left to the "
             "bottom right cell is highlighted: substitute k with s, keep i t t, substitute e with i, keep n, insert g. Distance 3.")
    p.append(text(w / 2, 28, "Edit distance: kitten → sitting = 3", 16, bold=True))
    x0, y0, cw, ch = 120, 78, 50, 36
    p.append(text(x0 + 4 * cw, y0 - 36, "prefix of sitting →", 11, SUB))
    for j, c in enumerate("-" + b):
        p.append(text(x0 + j * cw + cw / 2, y0 - 12, c, 15, ORANGE, bold=True, mono=True))
    for i, c in enumerate("-" + a):
        p.append(text(x0 - 14, y0 + i * ch + ch / 2 + 5, c, 15, ORANGE, "end", bold=True, mono=True))
    for i in range(len(a) + 1):
        for j in range(len(b) + 1):
            on = (i, j) in path
            fill, stroke, col = HL_GREEN if on else (BOX, EDGE, TXT)
            p.append(box(x0 + j * cw + 2, y0 + i * ch + 2, cw - 4, ch - 4, fill, stroke, 4))
            p.append(text(x0 + j * cw + cw / 2, y0 + i * ch + ch / 2 + 5, d[i][j], 15, col, bold=on, mono=True))
    yb = y0 + (len(a) + 1) * ch + 22
    p.append(text(w / 2, yb, "each cell = 1 + the smallest of: above (delete), left (insert), diagonal (substitute);", 12, SUB))
    p.append(text(w / 2, yb + 18, "a diagonal step is free when the two letters are equal", 12, SUB))
    p.append(text(w / 2, yb + 44, "green path, read from the top left: sub k→s · keep i · keep t · keep t · sub e→i · keep n · ins g", 12, TXT))
    save("dsa-edit-distance.svg", p)


def knapsack_table():
    items = [("tent", 5, 20), ("stove", 5, 20), ("camera", 6, 30), ("books", 2, 5)]
    cap = 10
    best = [[0] * (cap + 1)]
    for _, wt, val in items:
        prev = best[-1]
        best.append([max(prev[c], prev[c - wt] + val) if c >= wt else prev[c] for c in range(cap + 1)])
    # walk back: cells visited and the rows where an item was taken
    visited, taken = [], set()
    c = cap
    for i in range(len(items), 0, -1):
        visited.append((i, c))
        if best[i][c] != best[i - 1][c]:
            taken.add(i)
            c -= items[i - 1][1]
    visited.append((0, c))
    w, h = 720, 400
    p = head(w, h, "0/1 knapsack table",
             "Rows are the first i items (tent, stove, camera, books), columns are capacity 0 to 10. Each cell is the best "
             "value. Walking back from the bottom right shows the tent and the stove are taken, for a value of 40.")
    p.append(text(w / 2, 28, "0/1 knapsack: best value with the first i items and capacity w", 16, bold=True))
    x0, y0, cw, ch = 190, 78, 44, 38
    for c in range(cap + 1):
        p.append(text(x0 + c * cw + cw / 2, y0 - 12, c, 14, ORANGE, bold=True, mono=True))
    p.append(text(x0 - 12, y0 - 34, "capacity w →", 11, SUB, "end"))
    labels = ["no items"] + [f"+ {n} ({wt} kg, {v})" for n, wt, v in items]
    for i, lab in enumerate(labels):
        p.append(text(x0 - 12, y0 + i * ch + ch / 2 + 5, lab, 13, GREEN if i in taken else TXT, "end", bold=i in taken))
        for c in range(cap + 1):
            on = (i, c) in visited
            fill, stroke, col = (HL_ORANGE if i in taken and on else HL_BLUE if on else (BOX, EDGE, TXT))
            p.append(box(x0 + c * cw + 2, y0 + i * ch + 2, cw - 4, ch - 4, fill, stroke, 4))
            p.append(text(x0 + c * cw + cw / 2, y0 + i * ch + ch / 2 + 5, best[i][c], 14, col, bold=on, mono=True))
    yb = y0 + len(labels) * ch + 24
    p.append(text(w / 2, yb, "cell = max( leave the item: the cell above,  take it: value + the cell above at capacity w − weight )", 12, SUB))
    p.append(text(w / 2, yb + 20, "blue = walk back from the corner · orange = item taken (the value changed from the row above)", 12, SUB))
    p.append(text(w / 2, yb + 44, "best value 40 (tent + stove). Greedy by value per kilo takes the camera first and reaches only 35.", 12, TXT))
    save("dsa-knapsack-table.svg", p)


def backtracking_tree():
    w, h = 760, 440
    p = head(w, h, "Backtracking search tree for combination sum",
             "Numbers 2, 3 and 5 must add up to 5, each usable repeatedly. The search tree shows partial sums, the two solutions "
             "[2,3] and [5], one dead end [2,2], and branches that are pruned because the next number is larger than what is still needed.")
    p.append(text(w / 2, 28, "Combination sum: candidates {2, 3, 5}, target 5", 16, bold=True))

    def bt(cx, cy, l1, l2, kind):
        fill, stroke, col, dash = {
            "ok": (GREEN, GREEN, DARK, ""), "plain": (BOX, EDGE, TXT, ""),
            "dead": (BOX, ORANGE, ORANGE, ""), "cut": (BG, RED, RED, ' stroke-dasharray="5 4"')}[kind]
        p.append(f'<rect x="{cx - 48}" y="{cy - 22}" width="96" height="44" rx="8" fill="{fill}" stroke="{stroke}" stroke-width="2"{dash}/>')
        p.append(text(cx, cy - 3, l1, 14, col, bold=True, mono=True))
        p.append(text(cx, cy + 14, l2, 11, col if kind != "ok" else DARK))

    def link(x1, y1, x2, y2, label, cut=False):
        col = RED if cut else EDGE
        dash = ' stroke-dasharray="5 4"' if cut else ""
        p.append(f'<line x1="{x1}" y1="{y1 + 22}" x2="{x2}" y2="{y2 - 22}" stroke="{col}" stroke-width="1.6"{dash}/>')
        p.append(text((x1 + x2) / 2 + (-12 if x2 < x1 else 12), (y1 + y2) / 2 + 2, label, 12, ORANGE if not cut else RED, bold=True))

    root, l1y, l2y, l3y = (380, 80), 180, 280, 380
    nodes = {"root": (380, 80), "2": (190, 180), "3": (470, 180), "5": (650, 180),
             "22": (100, 280), "23": (230, 280), "25": (350, 280), "33": (450, 280), "35": (570, 280), "222": (100, 380)}
    for k, (a, b, lab, cut) in {
        "e1": ("root", "2", "+2", False), "e2": ("root", "3", "+3", False), "e3": ("root", "5", "+5", False),
        "e4": ("2", "22", "+2", False), "e5": ("2", "23", "+3", False), "e6": ("2", "25", "+5", True),
        "e7": ("3", "33", "+3", True), "e8": ("3", "35", "+5", True), "e9": ("22", "222", "+2, +3, +5", True)}.items():
        (x1, y1), (x2, y2) = nodes[a], nodes[b]
        link(x1, y1, x2, y2, lab, cut)
    bt(*nodes["root"], "[ ]", "need 5", "plain")
    bt(*nodes["2"], "[2]", "need 3", "plain")
    bt(*nodes["3"], "[3]", "need 2", "plain")
    bt(*nodes["5"], "[5]", "need 0  ✓", "ok")
    bt(*nodes["22"], "[2,2]", "need 1: dead end", "dead")
    bt(*nodes["23"], "[2,3]", "need 0  ✓", "ok")
    bt(*nodes["25"], "[2,5]", "5 &gt; 3: pruned", "cut")
    bt(*nodes["33"], "[3,3]", "3 &gt; 2: pruned", "cut")
    bt(*nodes["35"], "[3,5]", "5 &gt; 2: pruned", "cut")
    bt(*nodes["222"], "[2,2,…]", "all &gt; 1: pruned", "cut")
    p.append(text(w - 20, 340, "green: solution", 12, GREEN, "end"))
    p.append(text(w - 20, 360, "orange: dead end", 12, ORANGE, "end"))
    p.append(text(w - 20, 380, "red dashed: never visited", 12, RED, "end"))
    p.append(text(w - 20, 400, "(the sorted loop stops at the first number too big)", 11, SUB, "end"))
    save("dsa-backtracking-tree.svg", p)


def n_queens():
    w, h = 720, 440
    sol = [0, 4, 7, 5, 2, 6, 1, 3]
    p = head(w, h, "Eight queens solution",
             "An 8 by 8 board with one queen in every row and column and no two queens on a shared diagonal. "
             "Queens are in columns 0 4 7 5 2 6 1 3 from the top row down.")
    p.append(text(w / 2, 28, "Eight queens: one of the 92 solutions", 16, bold=True))
    x0, y0, cs = 60, 56, 44
    for r in range(8):
        for c in range(8):
            fill = "#334155" if (r + c) % 2 else BOX
            p.append(f'<rect x="{x0 + c * cs}" y="{y0 + r * cs}" width="{cs}" height="{cs}" fill="{fill}"/>')
        p.append(text(x0 - 12, y0 + r * cs + cs / 2 + 5, r, 12, SUB, "end", mono=True))
        p.append(text(x0 + r * cs + cs / 2, y0 - 8, r, 12, SUB, mono=True))
    p.append(box(x0, y0, 8 * cs, 8 * cs, "none", EDGE, 2))
    for r, c in enumerate(sol):
        cx, cy = x0 + c * cs + cs / 2, y0 + r * cs + cs / 2
        p.append(f'<circle cx="{cx}" cy="{cy}" r="16" fill="{ORANGE}" stroke="{DARK}" stroke-width="2"/>')
        p.append(text(cx, cy + 6, "Q", 17, DARK, bold=True))
    x1 = x0 + 8 * cs + 40
    p.append(text(x1, 80, "Three sets stop attacks", 14, TXT, "start", bold=True))
    rows = [("column", "c", "0 4 7 5 2 6 1 3"),
            ("diagonal", "r − c", "0 −3 −5 −2 2 −1 5 4"),
            ("anti-diagonal", "r + c", "0 5 9 8 6 11 7 10")]
    y = 110
    for name, formula, vals in rows:
        p.append(text(x1, y, f"{name} ({formula})", 13, ORANGE, "start", bold=True))
        p.append(text(x1, y + 20, vals, 13, TXT, "start", mono=True))
        y += 56
    p.append(text(x1, y + 4, "All values in a row are different,", 12, SUB, "start"))
    p.append(text(x1, y + 22, "so no two queens share a line.", 12, SUB, "start"))
    p.append(text(x1, y + 54, "The search places one queen per row", 12, SUB, "start"))
    p.append(text(x1, y + 72, "and only tries columns where all three", 12, SUB, "start"))
    p.append(text(x1, y + 90, "values are still unused.", 12, SUB, "start"))
    save("dsa-n-queens.svg", p)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    two_pointers()
    linked_list()
    doubly_sentinel()
    ring_buffer()
    hash_chaining()
    bst()
    heap_array()
    binary_search()
    merge_sort()
    partition()
    graph_representations()
    bfs_dfs()
    topo_sort()
    union_find()
    dijkstra()
    activity_selection()
    huffman()
    edit_distance()
    knapsack_table()
    backtracking_tree()
    n_queens()
    growth_rates()
    problem_solving()
    call_stack()
    recursion_tree()
    slice_header()
    print("wrote", sorted(f.name for f in OUT.glob("*.svg")))
