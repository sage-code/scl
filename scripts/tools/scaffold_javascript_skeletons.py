#!/usr/bin/env python3
"""Scaffold the javascript track's outline pages (S0 of the track rebuild).

Creates each planned topic page as a valid topic-template shell: real title,
real scope paragraph, the planned chapter outline, and a study note. Full
chapters replace these pages stage by stage (S1-S6) — the scaffold NEVER
overwrites an existing file. Also writes the matching sidebar sidecar
(data/<topic>.json) generated from the page's own headings.

Dry-run by default; pass --write to create files.
"""
import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TRACK = ROOT / "roadmap" / "javascript"

PAGE_TMPL = """<!DOCTYPE html>
<html lang="en" data-bs-theme="dark"><head>
  <meta charset="utf-8">
  <meta name="description" content="@@DESC@@">
  <meta name="author" content="Elucian Moise">
  <meta name="keywords" content="@@KEYWORDS@@">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">

  <title>@@TITLE@@</title>
  <link rel="canonical" href="https://sagecode.org/roadmap/javascript/@@FILE@@.html">
  <meta name="robots" content="index, follow">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" crossorigin="anonymous">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <link rel="icon" type="image/png" href="/images/favicon.ico">
  <link rel="stylesheet" href="/assets/prism.css">
  <script src="/assets/prism.js"></script>
  <link rel="stylesheet" href="/assets/css/sage-common.css">
  <link rel="stylesheet" href="/assets/css/content-topic.css">
  <link rel="stylesheet" href="/assets/css/content-sidebar.css">
  <link rel="stylesheet" href="/assets/css/content-code.css">
  <style>.side-bar{order:1}#main-content{order:2}@media(max-width:991px){.side-bar{display:none}.side-bar.active{display:block;position:absolute;top:100px;left:0;right:0;z-index:1000;background:rgba(0,0,0,.95)}}</style>
</head>
<body>

<div class="container">

  <header id="dynamic-header" class="container-fluid pb-2"></header>

  <div class="container-fluid px-0">
    <div class="row g-0">
      <aside class="side-bar col-lg-3 col-12">
        <div id="study-sidebar" class="sidebar-content shadow-sm p-3 sticky-top">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h5 class="mb-0" id="lab-topics">Lab Topics</h5>
          </div>
          <hr>
          <ul id="bookmark-list" class="list-unstyled"></ul>
        </div>
      </aside>

      <main id="main-content" class="col-lg-9 col-12 order-2 order-lg-1 p-3">
<h1 id="@@H1@@">@@TITLE@@</h1>

<div class="alert alert-secondary shadow-sm">
@@INTRO@@
</div>

<h2 id="outline">What this lesson covers</h2>

<p>
  This chapter is being written as part of the track rebuild, in track order. The outline
  below is the planned sequence; as each stage lands, every section ships with worked
  examples, contraexamples, diagrams where the concept is spatial, and a practice block.
</p>
<ul>
@@OUTLINE@@
</ul>

<h2 id="how-to-study">How to study it</h2>
<p>@@STUDY@@</p>
      </main>
    </div>
  </div>

  <hr>

  <footer class="footer copyright">
    <p class="x-small text-secondary mb-0">&copy; 2026 Sage-Code Laboratory</p>
  </footer>

</div>

<button id="open-sidebar" class="btn btn-primary d-lg-none shadow-lg" type="button">
  <span style="font-size: 24px;">&#9776;</span>
</button>

<script>
  window.TOPIC_CONFIG = {
    labId: 'javascript',
    topicId: '@@FILE@@',
    homeLink: './index.html#topics',
    labHomeLink: './index.html',
    inlineContent: true
  };
</script>
<script src="/sage.js" defer></script>
<script src="/assets/js/topic-loader.js" defer></script>

</body>
</html>
"""

TOPICS = [
    {
        "file": "operators",
        "title": "Operators, Coercion and Numbers",
        "desc": "JavaScript operators, type coercion, and the number system: equality, truthiness, and IEEE-754 pitfalls.",
        "keywords": "javascript operators, coercion, equality, nan, floating point",
        "h1": "operators-coercion-and-numbers",
        "intro": "Operators look familiar and then surprise you: <code>==</code> coerces, <code>+</code> prefers strings, and every number is a float. This lesson builds a precise model so the surprises become predictable.",
        "outline": [
            "Arithmetic, comparison, and logical operators",
            "<code>==</code> versus <code>===</code>: coercion contraexamples",
            "Truthy and falsy values; short-circuit evaluation",
            "Nullish coalescing (<code>??</code>) and optional chaining (<code>?.</code>)",
            "IEEE-754: <code>0.1 + 0.2</code>, <code>-0</code>, <code>Infinity</code>, <code>NaN</code>",
            "<code>BigInt</code>, number methods, and safe integers",
        ],
        "study": "Type every coercion contraexample into a console and predict the result before pressing Enter.",
    },
    {
        "file": "strings",
        "title": "Strings, Templates and Text",
        "desc": "JavaScript strings: methods, template literals, Unicode code points versus code units, and Intl formatting.",
        "keywords": "javascript strings, template literals, unicode, intl, regex",
        "h1": "strings-templates-and-text",
        "intro": "Strings are immutable UTF-16 sequences with a rich method set. This lesson covers day-to-day text handling and the Unicode traps that bite emoji and non-Latin scripts.",
        "outline": [
            "String primitives and the core method set",
            "Template literals and tagged templates",
            "Code units versus code points (the emoji contraexample)",
            "Regex essentials: <code>test</code>, <code>match</code>, <code>replace</code>",
            "<code>Intl</code>: casing, collation, and formatting",
        ],
        "study": "Break a string containing emoji with indexing, then fix it with code-point iteration.",
    },
    {
        "file": "arrays",
        "title": "Arrays, Iteration and Transformation",
        "desc": "JavaScript arrays: mutating versus non-mutating methods, map/filter/reduce pipelines, sort traps, and TypedArrays.",
        "keywords": "javascript arrays, map filter reduce, sort, typedarray",
        "h1": "arrays-iteration-and-transformation",
        "intro": "Arrays power most data handling in JavaScript. The skill is knowing which methods mutate, which copy, and which pitfalls hide in <code>sort</code> and sparse arrays.",
        "outline": [
            "Literals, <code>length</code>, and sparse arrays (contraexample)",
            "Mutating versus non-mutating methods",
            "<code>map</code>, <code>filter</code>, <code>reduce</code>: building pipelines",
            "<code>sort</code>: the default string-order trap",
            "<code>flat</code>, <code>flatMap</code>, <code>at</code>, and spread gotchas",
            "TypedArrays: binary data without the mystery",
        ],
        "study": "Rewrite a <code>for</code> loop as a <code>map</code>/<code>filter</code> pipeline, then find one case where the loop is genuinely better.",
    },
    {
        "file": "classes",
        "title": "Classes, Inheritance and Private Fields",
        "desc": "JavaScript classes: constructors, extends and super, static members, private fields, and this binding.",
        "keywords": "javascript classes, inheritance, private fields, this",
        "h1": "classes-inheritance-and-private-fields",
        "intro": "Classes are syntax over prototypes. This lesson teaches the syntax and the machinery underneath, because the bugs come from the machinery.",
        "outline": [
            "Classes are prototype plumbing with better syntax",
            "Constructors, fields, and methods",
            "<code>extends</code>, <code>super</code>, and static members",
            "Private fields and methods with <code>#</code>",
            "<code>this</code> at the call site: the binding rules",
            "Composition and mixins over deep hierarchies",
        ],
        "study": "Break a subclass by reordering constructor logic, then explain the error message.",
    },
    {
        "file": "modules",
        "title": "Modules and Code Organization",
        "desc": "JavaScript modules: ESM import/export, dynamic import(), the module pattern, and circular dependencies.",
        "keywords": "javascript modules, esm, import export, module pattern",
        "h1": "modules-and-code-organization",
        "intro": "Modules give every file its own scope and an explicit dependency graph. This lesson covers ESM as the browser runs it, plus the legacy patterns you will still meet.",
        "outline": [
            "Why modules exist: scope and dependency order",
            "<code>export</code> and <code>import</code> forms",
            "Dynamic <code>import()</code> and loading strategies",
            "The module pattern and IIFE namespaces",
            "Circular dependencies and how to break them",
            "ESM versus CommonJS (see the Node roadmap)",
        ],
        "study": "Split a working single-file script into three modules without changing its behavior.",
    },
    {
        "file": "runtime",
        "title": "The Runtime: Engine, Stack and Memory",
        "desc": "The JavaScript runtime: parsing, JIT compilation, the call stack, the heap, garbage collection, and hidden classes.",
        "keywords": "javascript runtime, v8, call stack, garbage collection, jit",
        "h1": "the-runtime-engine-stack-and-memory",
        "intro": "What actually happens between saving a file and seeing output: parsing, bytecode, JIT compilation, the call stack, the heap, and garbage collection.",
        "outline": [
            "From source to bytecode to JIT",
            "The call stack and stack frames",
            "The heap: objects, closures, and references",
            "Garbage collection and common leak patterns",
            "Hidden classes and inline caches: why object shape matters",
            "Reading engine internals from DevTools",
        ],
        "study": "Write a closure that leaks, watch it in the memory profiler, then fix it.",
    },
    {
        "file": "dom",
        "title": "DOM, Events and Rendering",
        "desc": "The DOM: selecting and building nodes, the event system, forms, reflow versus repaint, and accessibility.",
        "keywords": "javascript dom, events, delegation, reflow, accessibility",
        "h1": "dom-events-and-rendering",
        "intro": "The DOM is a live tree API. This lesson covers selecting and building nodes, the event system, and the rendering pipeline your code pays for.",
        "outline": [
            "The DOM tree and node types",
            "Selecting and creating elements safely",
            "Event propagation: capture, target, bubble",
            "Delegation and the <code>removeEventListener</code> pitfall",
            "Forms, validation, and constraint APIs",
            "Layout, reflow, and repaint costs",
            "Accessibility: semantics beat attributes",
        ],
        "study": "Log the propagation path of one click across capture, target, and bubble phases.",
    },
    {
        "file": "browser-apis",
        "title": "Storage, Network and Platform APIs",
        "desc": "Browser platform APIs: fetch with AbortController, storage tiers, URL and History, Web Components, Canvas and Web Audio.",
        "keywords": "fetch, localstorage, indexeddb, web components, browser apis",
        "h1": "storage-network-and-platform-apis",
        "intro": "The platform gives you network, storage, URL, and hardware APIs without any library. This lesson covers the ones every vanilla project uses.",
        "outline": [
            "<code>fetch</code>, JSON, and checking <code>response.ok</code> (contraexample)",
            "<code>AbortController</code> and cancellation",
            "Storage tiers: localStorage, sessionStorage, IndexedDB, cookies",
            "<code>URL</code>, <code>URLSearchParams</code>, and <code>History</code>",
            "Web Components: a custom element in one file",
            "Canvas and Web Audio in miniature",
        ],
        "study": "Build one page that fetches, cancels a slow request, and caches the result in storage.",
    },
    {
        "file": "devtools",
        "title": "Running and Debugging JavaScript",
        "desc": "Debugging JavaScript: DevTools panels, breakpoints, watch expressions, source maps, profiling, and Node inspection.",
        "keywords": "devtools, debugging, breakpoints, source maps, profiling",
        "h1": "running-and-debugging-javascript",
        "intro": "Debugging is a skill with tools. This lesson turns DevTools from a console into a workflow: breakpoints, watchers, profiles, and network waterfalls.",
        "outline": [
            "Running code: console, snippets, live expressions",
            "Sources: breakpoints, watch, call stacks",
            "Debugging asynchronous code and source maps",
            "Performance panel: reading a flame chart",
            "Network panel: waterfalls and throttling",
            "Node: <code>--inspect</code> and the same DevTools",
        ],
        "study": "Catch a deliberate logic bug using only breakpoints — no <code>console.log</code> allowed.",
    },
    {
        "file": "event-loop",
        "title": "The Event Loop and the Concurrency Model",
        "desc": "The JavaScript event loop: one thread, task and microtask queues, render steps, starvation, and measuring loop lag.",
        "keywords": "event loop, microtask, macrotask, concurrency, javascript",
        "h1": "the-event-loop-and-the-concurrency-model",
        "intro": "JavaScript runs your code on one thread and never two statements at once. Concurrency comes from queues; this lesson gives you the exact execution-order model.",
        "outline": [
            "Concurrency versus parallelism in JavaScript",
            "The call stack, the task queue, the microtask queue",
            "Timers, I/O callbacks, and rendering steps",
            "Starvation: one blocking loop freezes everything (contraexample)",
            "An execution-order quiz you can run and verify",
            "Measuring loop lag with performance.now()",
        ],
        "study": "Predict the log order of ten mixed setTimeout/Promise snippets, then run them.",
    },
    {
        "file": "async",
        "title": "Callbacks, Promises and async/await",
        "desc": "Asynchronous JavaScript: promise states and chaining, the four combinators, async/await, and unhandled-rejection pitfalls.",
        "keywords": "promises, async await, fetch, promise combinators, javascript",
        "h1": "callbacks-promises-and-async-await",
        "intro": "Asynchronous JavaScript evolved from callbacks to promises to async/await. This lesson teaches the current model and the failure modes that survive all three eras.",
        "outline": [
            "Callbacks and the pyramid problem",
            "Promise states and settlement rules",
            "Chaining with then, catch, finally",
            "all, allSettled, any, race: choosing a combinator",
            "async/await: sequential looks, concurrent runs",
            "Floating promises and unhandled rejections (contraexamples)",
        ],
        "study": "Refactor a callback pyramid into async/await without changing when anything runs.",
    },
    {
        "file": "generators",
        "title": "Iterators, Generators and Async Iteration",
        "desc": "JavaScript iterators and generators: the iterator protocol, yield, lazy pipelines, async iterators, and backpressure.",
        "keywords": "generators, iterators, yield, async iteration, backpressure",
        "h1": "iterators-generators-and-async-iteration",
        "intro": "Generators produce sequences on demand. They power lazy pipelines, custom iterables, and async streams — the foundation for backpressure.",
        "outline": [
            "The iterator protocol by hand",
            "Generator functions and yield",
            "yield* and recursive traversal",
            "Lazy pipelines and infinite sequences",
            "Async iterators and for await…of",
            "Backpressure with a bounded queue",
        ],
        "study": "Build an infinite Fibonacci generator, then cap it with a take(n) helper.",
    },
    {
        "file": "workers",
        "title": "Web Workers and Shared Memory",
        "desc": "Real parallelism in the browser: worker messaging, transferables, SharedArrayBuffer, Atomics, mutexes, and worker pools.",
        "keywords": "web workers, sharedarraybuffer, atomics, parallelism, transferable",
        "h1": "web-workers-and-shared-memory",
        "intro": "Workers are real threads: real parallelism in the browser. This lesson covers messaging, transferables, shared memory with Atomics, and the patterns that keep it safe.",
        "outline": [
            "Why threads: the limits of one CPU-bound thread",
            "Worker lifecycle and message passing",
            "Structured clone versus transferables (with a benchmark)",
            "SharedArrayBuffer and Atomics basics",
            "A mutex with Atomics.wait and Atomics.notify",
            "Worker pools and task scheduling",
            "Race conditions: a visible contraexample",
        ],
        "study": "Race two implementations of a heavy computation — one on the main thread, one in a worker pool — and time both.",
    },
    {
        "file": "performance",
        "title": "Performance and Scheduling Patterns",
        "desc": "JavaScript performance: the frame budget, debounce and throttle, batching, scheduler APIs, and the performance API.",
        "keywords": "performance, debounce, throttle, scheduler, requestidlecallback",
        "h1": "performance-and-scheduling-patterns",
        "intro": "Performance is a budget: one main thread, 60 frames a second. This lesson covers the patterns that keep interactive JavaScript inside that budget.",
        "outline": [
            "The frame budget and why 16 ms matters",
            "Debounce versus throttle (with a visual lab)",
            "Batching DOM writes against layout thrash",
            "scheduler.postTask and requestIdleCallback",
            "performance marks, measures, and User Timing",
            "Profiling a jank case end to end",
        ],
        "study": "Fix a scroll handler that fires 200 times a second using throttle, then measure the difference.",
    },
    {
        "file": "patterns",
        "title": "Patterns and Architecture in Vanilla JS",
        "desc": "Vanilla JavaScript architecture: one-way data flow, the module pattern, pub/sub, observable stores, and dependency injection.",
        "keywords": "javascript patterns, pub sub, observable store, architecture",
        "h1": "patterns-and-architecture-in-vanilla-js",
        "intro": "Frameworks sell architecture; vanilla JavaScript can have the same discipline. This lesson builds the small patterns real apps are made of.",
        "outline": [
            "One-way data flow: state, then render",
            "The module pattern and private state",
            "Pub/sub: an event bus in thirty lines",
            "An observable store with selectors",
            "Immutability discipline and structuredClone",
            "Dependency injection for testable code",
        ],
        "study": "Build a counter app twice — once with direct DOM writes, once from a store — and compare the diffs.",
    },
    {
        "file": "testing",
        "title": "Testing and Quality",
        "desc": "JavaScript testing without a framework: node:test, assertions, mocking, coverage, linting, and the TDD loop.",
        "keywords": "node test, unit testing, tdd, mocking, coverage",
        "h1": "testing-and-quality",
        "intro": "Node ships a test runner; the browser gives you assertions by example. This lesson builds the no-framework quality loop: test, lint, format.",
        "outline": [
            "Why test: the refund on every refactor",
            "node:test: tests, suites, and assertions",
            "Arrange-Act-Assert and test data",
            "Mocking timers, fetch, and modules",
            "Coverage and what it cannot tell you",
            "The TDD loop on a small module",
        ],
        "study": "Take one function from this track, write failing tests first, then make them pass.",
    },
    {
        "file": "pitfalls",
        "title": "JavaScript Pitfalls and Contraexamples",
        "desc": "A catalog of classic JavaScript traps shown as wrong code beside right code: coercion, this, loops, numbers, mutation, and silent failures.",
        "keywords": "javascript pitfalls, gotchas, contraexamples, common mistakes",
        "h1": "javascript-pitfalls-and-contraexamples",
        "intro": "A catalog of the classic JavaScript traps, each shown as wrong code beside right code, with the rule that prevents the bug.",
        "outline": [
            "Coercion surprises: ==, +, and if",
            "this binding: four ways to lose it",
            "var in loops and the closure trap",
            "Floating-point and parseInt hazards",
            "Mutation by reference: aliasing bugs",
            "JSON round-trip data loss",
            "Silent failures: empty catch blocks",
            "Prototype pollution and eval",
        ],
        "study": "For each trap, write the broken version, trigger it, then write the rule on a flashcard.",
    },
    {
        "file": "demo_examples",
        "title": "JavaScript Lab Examples",
        "desc": "Numbered, commented JavaScript demos grouped by phase: view the source in the code viewer or preview browser demos directly.",
        "keywords": "javascript demos, examples, practice, code viewer",
        "h1": "javascript-lab-examples",
        "intro": "Standalone, commented demos that follow the track's lesson order, grouped by phase. Every demo is a single file; language demos run with Node, browser demos run in place.",
        "outline": [
            "Foundations: syntax, types, functions",
            "Model: objects, arrays, collections, classes",
            "Runtime: errors, DOM, debugging",
            "Async: event loop, promises, generators",
            "Workers: parallelism and shared memory",
            "Patterns: store, bus, testing",
        ],
        "study": "Change one line in the code viewer, predict what changes, then verify in the preview.",
    },
    {
        "file": "samples",
        "title": "JavaScript Study Projects",
        "desc": "Guided vanilla-JavaScript study projects: a todo app, a fetch dashboard, a worker-pool processor, a hash-router SPA, and more.",
        "keywords": "javascript projects, practice, worker pool, spa",
        "h1": "javascript-study-projects",
        "intro": "Guided builds that combine several chapters at once — each project ships as a small, readable codebase with a walkthrough.",
        "outline": [
            "Todo with storage and filters",
            "Fetch-and-chart dashboard",
            "Parallel processor: a worker pool in action",
            "Hash-router single-page app",
            "Form wizard with validation",
            "Keyboard-driven data table",
        ],
        "study": "Build each project twice: once following the walkthrough, once from the blank file.",
    },
    # __TOPICS_END__
]

def render_page(topic: dict) -> str:
    outline = "\n".join(f"  <li>{item}</li>" for item in topic["outline"])
    return (
        PAGE_TMPL.replace("@@DESC@@", topic["desc"])
        .replace("@@KEYWORDS@@", topic["keywords"])
        .replace("@@TITLE@@", topic["title"])
        .replace("@@FILE@@", topic["file"])
        .replace("@@H1@@", topic["h1"])
        .replace("@@INTRO@@", topic["intro"])
        .replace("@@OUTLINE@@", outline)
        .replace("@@STUDY@@", topic["study"])
    )


def render_sidebar(topic: dict) -> str:
    data = [
        {
            "title": topic["title"],
            "link": f"#{topic['h1']}",
            "children": [
                {"title": "What this lesson covers", "link": "#outline"},
                {"title": "How to study it", "link": "#how-to-study"},
            ],
        }
    ]
    return json.dumps(data, indent=2, ensure_ascii=False) + "\n"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true", help="create files (default: dry-run)")
    args = ap.parse_args()

    created = skipped = 0
    for topic in TOPICS:
        page_path = TRACK / f"{topic['file']}.html"
        sidecar_path = TRACK / "data" / f"{topic['file']}.json"
        if page_path.exists() or sidecar_path.exists():
            skipped += 1
            print(f"[SKIP] {page_path.name} (already exists)")
            continue
        created += 1
        if args.write:
            page_path.write_text(render_page(topic), encoding="utf-8", newline="\n")
            sidecar_path.write_text(render_sidebar(topic), encoding="utf-8", newline="\n")
            print(f"[WRITE] {page_path.name} + data/{topic['file']}.json")
        else:
            print(f"[DRY] would create {page_path.name} + data/{topic['file']}.json")
    print(f"\n{created} page(s) {'created' if args.write else 'planned'}, {skipped} skipped.")


if __name__ == "__main__":
    main()
