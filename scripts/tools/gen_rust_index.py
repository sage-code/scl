#!/usr/bin/env python3
"""Regenerate roadmap/rust/index.html with the 25-topic, 5-phase professional structure."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "roadmap" / "rust" / "index.html"

def phase(name, rows):
    out = [f'      <tr class="roadmap-phase-row"><th colspan="4" class="roadmap-phase">{name}</th></tr>']
    for num, topic, label, desc in rows:
        out.append(
            f'      <tr data-topic="{topic}"><td class="text-center"><input type="checkbox" class="topic-check"></td>'
            f'<td>{num}</td><td><a href="/roadmap/rust/{topic}.html">{label}</a></td>'
            f'<td class="small text-secondary">{desc}</td></tr>'
        )
    return "\n".join(out)

p1 = phase("PHASE 1: FOUNDATIONS", [
    ("01", "overview", "Overview", "Rust's purpose, safety model, and ecosystem."),
    ("02", "setup", "Setup &amp; Toolchain", "Install rustup, Cargo, and your first program."),
    ("03", "syntax", "Syntax &amp; Expressions", "Statements, expressions, comments, keywords."),
    ("04", "types", "Scalar Types &amp; Variables", "Integers, floats, bool, char, inference, casting."),
    ("05", "composite", "Composite Types", "Tuples, arrays, structs, and enums."),
    ("06", "strings", "Strings &amp; Text", "&amp;str vs String, formatting, UTF-8."),
])
p2 = phase("PHASE 2: OWNERSHIP &amp; FUNCTIONS", [
    ("07", "ownership", "Ownership &amp; Borrowing", "Moves, references, and the borrow checker."),
    ("08", "lifetimes", "Lifetimes", "Reference validity and elision."),
    ("09", "functions", "Functions &amp; Closures", "fn, return values, and closures."),
    ("10", "collections", "Collections", "Vec, HashMap, HashSet, and slices."),
    ("11", "control", "Control Flow", "if, match, and loops."),
])
p3 = phase("PHASE 3: ABSTRACTION &amp; ERRORS", [
    ("12", "objects", "Traits &amp; Generics", "Traits, generics, and trait objects."),
    ("13", "modules", "Modules &amp; Crates", "mod, use, pub, and code organization."),
    ("14", "errors", "Error Handling", "Option, Result, and the ? operator."),
    ("15", "iterators", "Iterators &amp; Closures", "Lazy pipelines and combinators."),
    ("16", "pointers", "Smart Pointers", "Box, Rc/Arc, and RefCell."),
])
p4 = phase("PHASE 4: PROFESSIONAL", [
    ("17", "testing", "Testing &amp; Documentation", "#[test], integration tests, doc-tests."),
    ("18", "files", "File I/O", "Reading and writing files and JSON."),
    ("19", "packages", "Packages &amp; crates.io", "Cargo packages and dependencies."),
    ("20", "frameworks", "Frameworks &amp; Ecosystem", "Web, async, and embedded crates."),
    ("21", "concurrency", "Concurrency", "Threads, channels, and sync primitives."),
    ("22", "async", "Async &amp; Futures", "async/await and the tokio runtime."),
])
p5 = phase("PHASE 5: PRACTICE &amp; REFERENCE", [
    ("23", "demo_examples", "Lab Examples", "Single-file practice demos."),
    ("24", "samples", "Study Projects", "Composed mini-projects."),
    ("25", "references", "References &amp; Tools", "Playgrounds, docs, courses, samples."),
])

tbody = "\n".join([p1, p2, p3, p4, p5])

html = f"""<!DOCTYPE html>
<html lang="en" data-bs-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="description" content="Learn Rust programming with free, beginner-friendly tutorials. Master systems programming, ownership, memory safety, concurrency, and web development.">
  <meta name="keywords" content="Rust tutorial, learn Rust, Rust programming, ownership, borrowing, systems programming, memory safety">
  <meta name="author" content="Elucian Moise">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>Rust Tutorial - Learn Rust Programming for Systems Development</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" crossorigin="anonymous">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <link rel="icon" type="image/png" href="/images/favicon.ico">
  <link rel="stylesheet" href="/assets/css/sage-common.css">
  <link rel="stylesheet" href="/assets/css/sage-hero.css">
  <link rel="stylesheet" href="/assets/css/roadmap-index.css">
  <link rel="stylesheet" href="/assets/css/sage-cards.css">
  <link rel="canonical" href="https://sagecode.org/roadmap/rust/">
  <meta name="robots" content="index, follow">
</head>
<body>

<div class="container">
  <header id="dynamic-header" class="container-fluid pb-2"></header>

  <section class="hero-blackboard">
    <div class="blackboard-content">
      <h1 class="chalk-text">Rust Tutorial</h1>
      <p class="chalk-body mt-1">
        Rust is a statically typed, memory-safe systems language that guarantees thread safety without a garbage collector. This roadmap builds from first principles &mdash; syntax, then ownership and borrowing, abstractions, and on to concurrency, async, and the ecosystem &mdash; one small, gradual step at a time.
      </p>
    </div>
  </section>

  <div class="alert alert-secondary shadow-sm" role="status">
    <strong>Scope:</strong> Study the lessons in order, compile each example locally with <code>rustc</code> (or <code>cargo run</code>), and treat the index as a fast-forward, not a reference manual.
  </div>

  <h3 id="topics">Rust Study Progress</h3>
  <div class="progress mb-3" style="height: 25px;">
    <div id="roadmap-progress" class="progress-bar bg-success" role="progressbar" style="width: 0%;">0% Complete</div>
  </div>

  <table class="table table-bordered table-striped table-dark" id="roadmap-table" data-sage-roadmap="rust-main" data-lab-id="rust">
    <thead>
      <tr>
        <th>#</th>
        <th>RUST</th>
        <th>Topic</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
{tbody}
    </tbody>
  </table>

  <div class="alert alert-success shadow-sm mt-3" role="status">
    <strong>Credits:</strong> Lesson content drafted with DeepSeek via Fireworks AI. References: free tutorials and documentation below.
  </div>

  <h3 class="mt-4" id="references">Free References</h3>
  <p class="text-secondary">For the full categorized table &mdash; online Rust playgrounds, official documentation, courses, and sample codebases &mdash; see the <a href="/roadmap/rust/references.html">References &amp; Tools</a> page.</p>
  <ul>
    <li><a href="https://doc.rust-lang.org/book/" target="_blank" rel="noopener noreferrer nofollow">The Rust Programming Language (The Book) &mdash; free</a></li>
    <li><a href="https://doc.rust-lang.org/rust-by-example/" target="_blank" rel="noopener noreferrer nofollow">Rust by Example &mdash; free</a></li>
    <li><a href="https://github.com/rust-lang/rustlings" target="_blank" rel="noopener noreferrer nofollow">Rustlings &mdash; interactive exercises (free)</a></li>
    <li><a href="https://google.github.io/comprehensive-rust/" target="_blank" rel="noopener noreferrer nofollow">Comprehensive Rust &mdash; Google's free course</a></li>
    <li><a href="https://play.rust-lang.org/" target="_blank" rel="noopener noreferrer nofollow">Rust Playground &mdash; run Rust in the browser</a></li>
    <li><a href="https://doc.rust-lang.org/std/" target="_blank" rel="noopener noreferrer nofollow">The Rust Standard Library &mdash; API docs</a></li>
    <li><a href="https://tourofrust.com/" target="_blank" rel="noopener noreferrer nofollow">Tour of Rust &mdash; interactive tutorial</a></li>
  </ul>

  <footer class="footer copyright mt-5">
    <p class="x-small text-secondary mb-0">&copy; 2026 Sage-Code Laboratory</p>
  </footer>

</div>
<script src="/sage.js" defer></script>
<script src="/assets/js/lab-progress-bridge.js" defer></script>
<script src="/assets/js/roadmap.js" defer></script>
</body>
</html>
"""

OUT.write_text(html, encoding="utf-8")
print(f"wrote {OUT} ({len(html)} chars)")

