#!/usr/bin/env python3
"""Generate the Elixir track's SVG diagrams (roadmap/elixir/img/*.svg).

Deterministic generator — creates NEW files only (never overwrites
existing tracked SVGs unless --force). Style follows
manual/ARCHITECTURE.md §Diagrams (dark-theme spec): solid canvas,
solid boxes, light-on-dark text, labelled arrows, >=12px gaps.

Usage:
  python scripts/tools/gen_elixir_diagrams.py --dry-run
  python scripts/tools/gen_elixir_diagrams.py [--force]
"""

import argparse
import os

OUT = os.path.join("roadmap", "elixir", "img")

# Palette (matches roadmap/ada/img + roadmap/fortran/img — compliant
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
        f"  <title>{title}</title>\n"
        f"  <desc>{subtitle}</desc>\n\n"
        f'  <rect x="0" y="0" width="{width}" height="{height}" fill="{CANVAS}"/>\n'
        f'  <rect x="12" y="12" width="{width - 24}" height="{height - 24}" fill="none" stroke="{BORDER}" stroke-width="2" rx="10"/>\n'
    )


def footer():
    return "</svg>\n"


def text(x, y, content, size=15, fill=TEXT, mono=False, weight=None, anchor=None):
    extra = f' font-weight="{weight}"' if weight else ""
    anch = f' text-anchor="{anchor}"' if anchor else ""
    font = MONO if mono else SANS
    return f'  <text x="{x}" y="{y}" font-family="{font}" font-size="{size}" fill="{fill}"{extra}{anch}>{content}</text>\n'


def box(x, y, w, h, label, sub=None, accent="blue", fill=BOX, text_fill=None):
    stroke = ACCENTS[accent]
    body = f'  <rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}" stroke="{stroke}" stroke-width="2" rx="6"/>\n'
    body += text(x + 16, y + 30, label, 15, text_fill or stroke, mono=True)
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


# ── Diagram bodies ──────────────────────────────────────────────────

def beam_runtime():
    b = header("The BEAM runtime stack", "Elixir compiles to BEAM bytecode alongside Erlang; OTP supplies processes and supervision on a preemptive scheduler.")
    b += text(40, 52, "One language surface, one runtime", 23, TEXT, weight="bold")
    b += text(40, 78, "Elixir and Erlang compile to the same bytecode and call each other freely — OTP is a shared library, not a framework choice.", 15, MUTED)
    b += box(40, 110, 200, 80, ".ex / .exs source", "Elixir compiler", "blue")
    b += box(300, 110, 200, 80, ".erl source", "Erlang compiler", "blue")
    b += arrow(246, 150, 296, 150, "green", "same AST family")
    b += box(560, 110, 300, 80, "BEAM bytecode", "modules, functions, attributes", "orange")
    b += arrow(506, 150, 556, 150, "orange")
    b += box(40, 230, 400, 90, "OTP", "GenServer · Supervisor · Registry · Task · app env", "green")
    b += box(500, 230, 360, 90, "BEAM scheduler + GC", "preemptive slices, one heap per process", "red")
    b += arrow(240, 196, 240, 226, "green")
    b += arrow(680, 196, 680, 226, "red")
    b += text(40, 356, "A crash in one process never pauses another: heaps are isolated and collected individually, in microseconds.", 13, FAINT)
    return b + footer()


def language_landscape():
    b = header("Language positioning map", "Plotting C, Rust, Go, Python, Ruby and Elixir by concurrency model and fault-tolerance guarantees.", 920, 430)
    b += text(40, 52, "What each runtime optimizes", 23, TEXT, weight="bold")
    b += text(40, 78, "Axes: horizontal = concurrency model (shared state to isolated actors); vertical = fault tolerance (manual to built-in).", 15, MUTED)
    b += line(90, 370, 850, 370, "green")
    b += line(90, 370, 90, 120, "green")
    b += text(700, 390, "shared state  —>  isolated actors", 13, MUTED)
    b += text(98, 128, "fault tolerance", 13, MUTED)
    pts = [
        (150, 320, "C", "manual memory", "none", "red"),
        (300, 300, "Rust", "threads, no races", "Result types", "orange"),
        (450, 320, "Go", "goroutines", "panic/recover", "blue"),
        (600, 300, "Python", "GIL / asyncio", "none", "blue"),
        (730, 330, "Ruby", "GIL threads", "none", "orange"),
        (700, 150, "Elixir", "actors on the BEAM", "supervision trees", "green"),
    ]
    for x, y, name, sub1, sub2, accent in pts:
        b += box(x, y, 130, 64, name, sub1, accent)
        b += text(x + 16, y + 84, sub2, 12, FAINT)
    b += text(40, 412, "Elixir sits in the corner where concurrency and fault tolerance are runtime guarantees, not library choices.", 13, FAINT)
    return b + footer()

def toolchain_flow():
    b = header("The Elixir toolchain", "A version manager pins the OTP and Elixir pair; mix builds, hex fetches, and release packages the deployment artifact.")
    b += text(40, 52, "From version manager to release", 23, TEXT, weight="bold")
    b += text(40, 78, "Install the pair once; everything else ships with Elixir itself.", 15, MUTED)
    b += box(40, 120, 180, 80, "mise / asdf", "pins OTP 28 + Elixir 1.20", "blue")
    b += box(280, 120, 160, 80, "iex", "interactive shell", "green")
    b += box(500, 120, 160, 80, "mix", "build · test · tasks", "orange")
    b += box(720, 120, 150, 80, "hex", "package registry", "purple")
    b += arrow(226, 160, 276, 160, "green")
    b += arrow(446, 160, 496, 160, "green")
    b += arrow(666, 160, 716, 160, "green")
    b += box(120, 250, 300, 80, "mix release", "code + config + runtime", "red")
    b += box(520, 250, 280, 80, "deployment artifact", "self-contained: no Erlang install", "red")
    b += arrow(426, 290, 514, 290, "red")
    b += text(40, 356, "One Elixir version supports a specific OTP range — the pair (e.g. 1.20-otp-28) is the contract.", 13, FAINT)
    return b + footer()


def pipeline_transform():
    b = header("A pipeline transformation", "Each pipe step consumes one value and produces a new immutable one; nothing is mutated in place.")
    b += text(40, 52, "Data flowing through the pipe operator", 23, TEXT, weight="bold")
    b += text(40, 78, "The same word-frequency pipeline from the syntax lesson, step by step.", 15, MUTED)
    steps = [
        (40, "text", "Fun to learn, fun to ship", "blue"),
        (240, "downcase", "fun to learn, fun to ship", "green"),
        (440, 'replace ","', "fun to learn  fun to ship", "orange"),
        (640, "split", "[six strings]", "red"),
    ]
    for x, fn, out, accent in steps:
        b += box(x, 120, 180, 80, fn, out, accent)
    for i in range(3):
        x1 = steps[i][0] + 186
        b += arrow(x1, 160, x1 + 48, 160, "green")
    b += box(120, 250, 240, 80, "frequencies", "%{fun: 2, to: 2 ...}", "purple")
    b += box(480, 250, 280, 80, "IO.inspect", "peek at any step, no side effects", "blue")
    b += arrow(730, 160, 730, 218, "green")
    b += line(730, 220, 240, 220, "green", dashed=True)
    b += arrow(240, 220, 240, 246, "green")
    b += line(480, 290, 366, 290, "green", dashed=True)
    b += text(40, 356, "Each step returns a NEW value — inserting IO.inspect between steps can never corrupt the result.", 13, FAINT)
    return b + footer()


def immutability():
    b = header("Rebinding, not mutation", "Map.put returns a new map; the old binding still sees the original value, so sharing stays safe.")
    b += text(40, 52, "Two bindings, two values, one shared structure", 23, TEXT, weight="bold")
    b += text(40, 78, "map = %{a: 1}   then   bigger = Map.put(map, :b, 2)", 15, MUTED, mono=True)
    b += box(120, 120, 280, 90, "map", "%{a: 1}  (original, untouched)", "blue")
    b += box(520, 120, 300, 90, "bigger", "%{a: 1, b: 2}  (new value)", "green")
    b += arrow(406, 165, 514, 165, "green", "Map.put/3")
    b += text(120, 250, "Who sees what:", 15, TEXT, weight="bold")
    b += text(120, 276, "code holding map     -> %{a: 1}          (always)", 14, MUTED, mono=True)
    b += text(120, 298, "code holding bigger  -> %{a: 1, b: 2}   (always)", 14, MUTED, mono=True)
    b += box(120, 312, 640, 44, "persistent data structure", "only the changed path is new — a 'copy' of a 200k map takes microseconds", "purple", fill="#1f2a37")
    b += text(40, 372, "Consequence: data can cross process boundaries with no locks — nobody can change a shared value behind your back.", 13, FAINT)
    return b + footer()


def pattern_matching():
    b = header("Pattern matching flow", "Clauses are tried in order; the first pattern that matches decides the branch and binds its variables.")
    b += text(40, 52, "case File.read(path)", 23, TEXT, weight="bold")
    b += text(40, 78, "One value, three patterns, one selected branch — matching on SHAPE, not just value.", 15, MUTED)
    b += box(60, 150, 160, 70, "value", "{:error, :enoent}", "blue")
    ys = [(110, "green", "{:ok, body}", "bind body -> parse(body)"),
          (200, "orange", "{:error, :enoent}", "specific error -> friendly message"),
          (290, "red", "{:error, reason}", "any other reason -> bind reason")]
    for y, accent, pat, act in ys:
        b += box(320, y, 220, 64, pat, "", accent)
        b += text(560, y + 30, act, 13, MUTED)
        b += arrow(226, 185, 316, y + 32, accent)
    b += text(40, 356, "Clause ORDER matters: specific patterns first, catch-alls last. A guard can refine any pattern.", 13, FAINT)
    return b + footer()

def recursion_tail():
    b = header("Body recursion vs tail calls", "Body recursion keeps every frame until the end; a tail call with an accumulator reuses one frame.")
    b += text(40, 52, "Two ways to sum a list", 23, TEXT, weight="bold")
    b += text(40, 78, "h + sum(t) keeps frames; do_sum(t, acc + h) reuses the frame — constant stack.", 15, MUTED)
    b += box(60, 120, 340, 210, "BODY recursion", "h + sum_body(t)", "orange")
    frames = ["frame n:   waiting for sum(t)", "frame n-1: waiting ...", "...", "frame 1:   base case -> 0"]
    for i, f in enumerate(frames):
        b += text(80, 170 + i * 30, f, 13, MUTED, mono=True)
    b += box(500, 120, 360, 210, "TAIL call + accumulator", "do_sum(t, acc + h)", "green")
    b += text(520, 170, "one frame reused per step:", 13, MUTED, mono=True)
    for i, s in enumerate(["do_sum([1,2,3], 0)", "do_sum([2,3], 1)", "do_sum([3], 3)", "do_sum([], 6)  -> 6"]):
        b += text(520, 200 + i * 30, s, 13, TEXT, mono=True)
    b += text(40, 356, "The BEAM turns a last-action recursive call into a jump: loops run in constant stack space, any list length.", 13, FAINT)
    return b + footer()


def collections_cost():
    b = header("Collection operation costs", "Lists are cheap at the head and expensive at the tail; maps and tuples buy different guarantees.")
    b += text(40, 52, "Choose the structure by its cheap operations", 23, TEXT, weight="bold")
    b += text(40, 78, "Cost comparison for common operations (n = element count).", 15, MUTED)
    rows = [
        ("list  [h | t]  prepend", "O(1)", "green", "head/tail walks, enumeration"),
        ("list  append", "O(n)", "red", "use prepend + reverse instead"),
        ("list  length / index", "O(n)", "red", "track counts yourself"),
        ("tuple  elem(t, i)", "O(1)", "green", "fixed shapes: returns, coordinates"),
        ("map  lookup / update", "O(log n)", "orange", "keyed data, pattern matching"),
        ("mapset  membership", "O(1)", "green", "uniqueness, set algebra"),
    ]
    for i, (op, cost, accent, note) in enumerate(rows):
        y = 115 + i * 36
        b += box(60, y, 300, 30, op, "", accent)
        b += text(390, y + 21, cost, 14, ACCENTS[accent], mono=True, weight="bold")
        b += text(500, y + 21, note, 13, MUTED)
    b += text(40, 356, "Structural sharing makes map 'copies' cheap; linked lists make tail edits expensive — pick accordingly.", 13, FAINT)
    return b + footer()


def protocol_dispatch():
    b = header("Protocol dispatch table", "One describe/1 call routes to the implementation for the value's type — extensible by any module.")
    b += text(40, 52, "One call, many implementations", 23, TEXT, weight="bold")
    b += text(40, 78, "defprotocol Render + defimpl per type; consolidated into one dispatch table at compile time.", 15, MUTED)
    b += box(60, 160, 220, 80, "Render.to_text(v)", "caller does not know the type", "blue")
    b += box(420, 90, 260, 64, "Invoice impl", "Invoice A-1: $99", "green")
    b += box(420, 180, 260, 64, "Ticket impl", "Row 4, seat 12", "orange")
    b += box(420, 270, 260, 64, "Integer impl", "number: 7", "purple")
    for y, accent in [(122, "green"), (212, "orange"), (302, "purple")]:
        b += arrow(286, 200, 416, y, accent)
    b += text(40, 356, "Protocols dispatch on DATA type and extend types you do not own; behaviours are contracts for MODULES.", 13, FAINT)
    return b + footer()


def error_strategy():
    b = header("Two failure paths", "Expected failures return {:error, reason} values; unexpected ones crash the process and become supervisor work.")
    b += text(40, 52, "Expected vs unexpected", 23, TEXT, weight="bold")
    b += text(40, 78, "Choosing the path per situation is what makes BEAM systems robust without try/except soup.", 15, MUTED)
    b += box(60, 150, 220, 90, "an operation", "parses, writes, calls out", "blue")
    b += box(420, 90, 240, 64, "{:error, reason}", "expected: caller handles it", "orange")
    b += box(420, 230, 240, 64, "raise / crash", "unexpected: let it die", "red")
    b += arrow(286, 175, 416, 122, "orange", "tagged tuple")
    b += arrow(286, 225, 416, 262, "red", "exit signal")
    b += box(720, 230, 150, 64, "supervisor", "restarts clean", "green")
    b += arrow(666, 262, 716, 262, "red")
    b += text(40, 356, "Rule of thumb: if the CALLER can act on the failure, return a tuple; if it is a bug, crash — the tree absorbs it.", 13, FAINT)
    return b + footer()

def process_mailbox():
    b = header("A process and its mailbox", "Messages queue in the mailbox; the process consumes them one at a time, updating private state.")
    b += text(40, 52, "The actor model on the BEAM", 23, TEXT, weight="bold")
    b += text(40, 78, "senders cannot touch state — they can only leave messages. The mailbox serializes everything.", 15, MUTED)
    # senders
    b += box(40, 130, 180, 64, "sender A", "send(pid, msg)", "blue")
    b += box(40, 220, 180, 64, "sender B", "send(pid, msg)", "orange")
    # mailbox
    b += box(300, 130, 220, 154, "mailbox", "FIFO queue of messages", "purple")
    b += text(316, 210, "{:ping, pid}", 13, TEXT, mono=True)
    b += text(316, 234, "{:get, pid}", 13, TEXT, mono=True)
    b += text(316, 258, "{:increment, pid}", 13, TEXT, mono=True)
    b += arrow(226, 162, 296, 170, "blue")
    b += arrow(226, 252, 296, 244, "orange")
    # server
    b += box(600, 130, 260, 154, "process", "receive one message at a\ntime; state is private", "green")
    b += arrow(526, 200, 596, 200, "purple", "receive")
    b += box(600, 300, 260, 56, "reply", "send(caller, result)", "red")
    b += arrow(730, 290, 730, 296, "red")
    b += text(40, 356, "State never needs locking: the mailbox IS the serialization point. One overloaded sender cannot corrupt another.", 13, FAINT)
    return b + footer()


def genserver_lifecycle():
    b = header("GenServer lifecycle", "start_link calls init; handle_call and handle_cast process messages; handle_info receives everything else.")
    b += text(40, 52, "One behaviour, four callbacks", 23, TEXT, weight="bold")
    b += text(40, 78, "Every callback returns {reply, new_state} or {noreply, new_state} — the state is just data.", 15, MUTED)
    b += box(60, 110, 220, 60, "start_link / init", "returns initial state", "blue")
    b += box(360, 90, 240, 64, "handle_call", "caller BLOCKS for the reply", "green")
    b += box(360, 180, 240, 64, "handle_cast", "fire-and-forget, no guarantee", "orange")
    b += box(360, 270, 240, 64, "handle_info", "timers, monitors, raw sends", "purple")
    b += arrow(286, 140, 356, 122, "green")
    b += arrow(286, 140, 356, 212, "orange")
    b += arrow(286, 140, 356, 302, "purple")
    b += box(680, 180, 190, 64, "new state", "loops back to receive", "red")
    for y in [122, 212, 302]:
        b += arrow(606, y + 32, 676, 212, "red")
    b += text(40, 356, "A callback crash is the SUPERVISOR's problem, not the server's: state is lost, init/1 runs again.", 13, FAINT)
    return b + footer()


def supervision_tree():
    b = header("A supervision tree", "Supervisors watch children; restart cascades stop at supervisor boundaries per strategy.")
    b += text(40, 52, "Restarts are local by design", 23, TEXT, weight="bold")
    b += text(40, 78, "one_for_one: a crashed child restarts alone. one_for_all / rest_for_one widen the blast radius deliberately.", 15, MUTED)
    b += box(360, 110, 200, 60, "App supervisor", "strategy: rest_for_one", "blue")
    b += box(120, 220, 180, 60, "Registry", "names", "green")
    b += box(360, 220, 180, 60, "Cache", "GenServer", "green")
    b += box(600, 220, 220, 60, "Worker sup", "strategy: one_for_one", "orange")
    for x in [210, 450, 710]:
        b += arrow(x, 176, x, 216, "green")
    b += box(560, 320, 140, 50, "worker 1", "", "purple")
    b += box(720, 320, 140, 50, "worker 2", "", "purple")
    b += arrow(710, 286, 640, 316, "purple")
    b += arrow(710, 286, 790, 316, "purple")
    b += text(40, 356, "Crash the Cache under rest_for_one and everything started AFTER it (the worker tree) restarts too — order encodes dependencies.", 13, FAINT)
    return b + footer()


def release_pipeline():
    b = header("From mix release to deployment", "The release bundles compiled code, configuration, and the runtime: deploy the directory, not a language install.")
    b += text(40, 52, "The release pipeline", 23, TEXT, weight="bold")
    b += text(40, 78, "MIX_ENV=prod mix release — repeatable, self-contained, ops-friendly.", 15, MUTED)
    b += box(40, 130, 180, 80, "mix deps.get", "locked versions", "blue")
    b += box(270, 130, 180, 80, "mix compile", "to BEAM bytecode", "green")
    b += box(500, 130, 180, 80, "runtime.exs", "evaluated at BOOT", "orange")
    b += box(730, 130, 140, 80, "tarball", "the artifact", "purple")
    b += arrow(226, 170, 266, 170, "green")
    b += arrow(456, 170, 496, 170, "orange")
    b += arrow(686, 170, 726, 170, "purple")
    b += box(120, 260, 300, 70, "bin/my_app", "start · daemon · remote · rpc", "red")
    b += text(40, 356, "bin/my_app remote attaches an iex session to the LIVE node — the same IEx tools, pointed at production.", 13, FAINT)
    return b + footer()

def distribution_topology():
    b = header("A BEAM cluster", "Nodes sharing a cookie form a fully-connected mesh; messages and erpc calls cross nodes transparently.")
    b += text(40, 52, "Distribution is a runtime feature", 23, TEXT, weight="bold")
    b += text(40, 78, 'Node.connect(:"beta@host") with a shared cookie — then send/2 works across machines.', 15, MUTED)
    b += box(80, 130, 280, 130, "alpha@host", "processes + Registry + PubSub", "blue")
    b += box(560, 130, 280, 130, "beta@host", "processes + Registry + PubSub", "green")
    b += arrow(366, 175, 554, 175, "purple", ":erpc.call/4")
    b += arrow(554, 215, 366, 215, "purple", "PubSub broadcast")
    b += text(300, 300, "TCP mesh: every node keeps a direct link to every node it has connected to.", 13, MUTED)
    b += text(40, 340, "Net-split reality: both sides keep serving; keep authoritative state in Postgres and use the mesh for coordination.", 13, FAINT)
    return b + footer()


def ecto_flow():
    b = header("The Ecto flow", "User params flow through a schema, a changeset pipeline of validations, and the Repo into the database.")
    b += text(40, 52, "schema -> changeset -> repo", 23, TEXT, weight="bold")
    b += text(40, 78, "Invalid input never reaches the database; errors accumulate in a struct you can render.", 15, MUTED)
    b += box(40, 140, 180, 80, "params", '%{"email" => "nope"}', "blue")
    b += box(270, 140, 200, 80, "schema", "types, defaults, associations", "green")
    b += box(520, 140, 200, 80, "changeset", "cast -> validate -> constrain", "orange")
    b += box(760, 140, 110, 80, "Repo", "insert / update", "purple")
    b += arrow(226, 180, 266, 180, "green")
    b += arrow(476, 180, 516, 180, "orange")
    b += arrow(726, 180, 756, 180, "purple")
    b += box(520, 260, 200, 60, "errors map", "render to the API client", "red")
    b += arrow(620, 226, 620, 256, "red", "invalid?")
    b += text(40, 356, "Queries are macros compiled against the schema — a typo'd field is a compile error, not an injection.", 13, FAINT)
    return b + footer()


def phoenix_request():
    b = header("The Phoenix request lifecycle", "The conn flows through endpoint plugs, router pipelines, a controller, a context, and Ecto.")
    b += text(40, 52, "Every stage is a plain module", 23, TEXT, weight="bold")
    b += text(40, 78, "Nothing is hidden in the framework: read it, reorder it, replace it.", 15, MUTED)
    stages = [
        (40, "Endpoint", "static, parsers, session", "blue"),
        (250, "Router", "pipelines: browser / api", "green"),
        (460, "Controller", "params -> context -> render", "orange"),
        (670, "Context", "domain logic, no web code", "red"),
    ]
    for x, name, sub, accent in stages:
        b += box(x, 140, 190, 90, name, sub, accent)
    for i in range(len(stages) - 1):
        b += arrow(stages[i][0] + 196, 185, stages[i][0] + 246, 185, "green")
    b += box(670, 270, 190, 60, "Ecto", "queries + changesets", "purple")
    b += arrow(765, 236, 765, 266, "purple")
    b += arrow(420, 236, 420, 300, "blue", "render / json")
    b += box(160, 300, 220, 56, "view / HEEx", "template -> HTML", "blue")
    b += text(40, 356, "Controllers call contexts; contexts know nothing about the web layer — the seam that scales with teams.", 13, FAINT)
    return b + footer()

def liveview_cycle():
    b = header("The LiveView cycle", "mount assigns state; events and messages update assigns; only changed assigns diff over the socket.")
    b += text(40, 52, "One process per browser session", 23, TEXT, weight="bold")
    b += text(40, 78, "The server renders HTML; a WebSocket ships minimal diffs. No client framework required.", 15, MUTED)
    b += box(60, 130, 200, 70, "mount", "assign(socket, count: 0)", "blue")
    b += box(320, 60, 260, 70, "handle_event", 'phx-click="increment"', "green")
    b += box(320, 190, 260, 70, "handle_info", "PubSub broadcasts", "purple")
    b += box(640, 130, 220, 70, "render + diff", "only changed assigns", "orange")
    b += arrow(266, 165, 316, 100, "green")
    b += arrow(266, 165, 316, 220, "purple")
    b += arrow(586, 95, 636, 160, "orange")
    b += arrow(586, 225, 636, 175, "orange")
    b += arrow(750, 206, 750, 330, "orange")
    b += arrow(750, 330, 165, 330, "orange", "browser (WebSocket)")
    b += arrow(165, 330, 165, 204, "orange")
    b += text(40, 356, "Streams patch single rows in large lists; Presence tracks connected users across the cluster.", 13, FAINT)
    return b + footer()


def architecture_layers():
    b = header("System layering", "Dependencies point downward only: web code calls contexts; contexts own data and processes.")
    b += text(40, 52, "Where state lives, where boundaries sit", 23, TEXT, weight="bold")
    b += text(40, 78, "One Elixir system, three layers, one supervision tree.", 15, MUTED)
    b += box(120, 110, 640, 64, "web layer", "Endpoint · Router · Controllers · LiveViews (transport only)", "blue")
    b += box(120, 190, 640, 64, "contexts", "Billing · Identity · Catalog — the domain API", "green")
    b += box(120, 270, 300, 64, "processes", "GenServers · Registry · ETS", "orange")
    b += box(460, 270, 300, 64, "persistence", "Ecto · external services", "purple")
    b += arrow(300, 174, 300, 186, "green")
    b += arrow(620, 174, 620, 186, "green")
    b += line(280, 254, 280, 266, "orange")
    b += line(600, 254, 600, 266, "purple")
    b += text(40, 356, "Nothing calls upward: a context must not import Plug.Conn — that single rule keeps domain code testable.", 13, FAINT)
    return b + footer()


def nx_pipeline():
    b = header("Nx execution model", "defn code is compiled to a native backend by EXLA; ordinary Elixir processes orchestrate it.")
    b += text(40, 52, "Elixir orchestrates, native code computes", 23, TEXT, weight="bold")
    b += text(40, 78, "The same defn function runs on CPU, GPU, or TPU depending on the backend.", 15, MUTED)
    b += box(60, 140, 200, 80, "Elixir process", "fetch, schedule, respond", "blue")
    b += box(320, 140, 200, 80, "defn softmax(t)", "pure tensor operations", "green")
    b += box(580, 140, 140, 80, "EXLA / Torchx", "JIT compile", "orange")
    b += box(760, 140, 110, 80, "CPU/GPU/TPU", "native execution", "red")
    b += arrow(266, 180, 316, 180, "green")
    b += arrow(526, 180, 576, 180, "orange")
    b += arrow(726, 180, 756, 180, "red")
    b += box(320, 270, 400, 60, "Nx.Serving", "batched, supervised inference for many callers", "purple")
    b += arrow(460, 226, 460, 266, "purple")
    b += text(40, 356, "Bumblebee rides this pipeline: pretrained models served behind a supervised, batching GenServer.", 13, FAINT)
    return b + footer()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="list files without writing")
    parser.add_argument("--force", action="store_true", help="overwrite existing files")
    args = parser.parse_args()

    diagrams = {
        "elixir-beam-runtime.svg": beam_runtime,
        "elixir-language-landscape.svg": language_landscape,
        "elixir-toolchain-flow.svg": toolchain_flow,
        "elixir-pipeline-transform.svg": pipeline_transform,
        "elixir-immutability.svg": immutability,
        "elixir-pattern-matching.svg": pattern_matching,
        "elixir-recursion-tail.svg": recursion_tail,
        "elixir-collections-cost.svg": collections_cost,
        "elixir-protocol-dispatch.svg": protocol_dispatch,
        "elixir-error-strategy.svg": error_strategy,
        "elixir-process-mailbox.svg": process_mailbox,
        "elixir-genserver-lifecycle.svg": genserver_lifecycle,
        "elixir-supervision-tree.svg": supervision_tree,
        "elixir-release-pipeline.svg": release_pipeline,
        "elixir-distribution-topology.svg": distribution_topology,
        "elixir-ecto-flow.svg": ecto_flow,
        "elixir-phoenix-request.svg": phoenix_request,
        "elixir-liveview-cycle.svg": liveview_cycle,
        "elixir-architecture-layers.svg": architecture_layers,
        "elixir-nx-pipeline.svg": nx_pipeline,
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
            print(f"[dry]  {path} ({len(content)} bytes)")
            continue
        with open(path, "w", encoding="utf-8") as handle:
            handle.write(content)
        print(f"[ok]   {path}")
        written += 1
    print(f"Done: {written} written, {skipped} skipped.")


if __name__ == "__main__":
    main()





