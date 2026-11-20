(function () {
  "use strict";

  const identifierPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const statusLabels = {
    none: "None",
    fail: "Fail",
    pass: "Pass"
  };
  const statusClasses = {
    none: "text-bg-secondary",
    fail: "text-bg-danger",
    pass: "text-bg-success"
  };
  const quizSetsByTrack = {
    go: [
      {
        level: "A",
        topic: "syntax",
        title: "Go Foundations",
        description: "Check package structure, declarations, operators, and basic Go execution."
      },
      {
        level: "B",
        topic: "syntax",
        title: "Go Applied Programming",
        description: "Apply scope, control flow, slices, and explicit error returns to short programs."
      },
      {
        level: "C",
        topic: "syntax",
        title: "Go Engineering Practice",
        description: "Reason about defer, wrapped errors, nil slices, and channel behavior."
      }
    ],
    html: [
      {
        level: "A",
        topic: "fundamentals",
        title: "HTML Foundations",
        description: "Review document structure, elements, attributes, links, tables, forms, and semantic basics."
      },
      {
        level: "B",
        topic: "fundamentals",
        title: "HTML Applied Practice",
        description: "Apply forms, accessible tables, responsive media, resource loading, and browser validation."
      },
      {
        level: "C",
        topic: "fundamentals",
        title: "HTML Engineering Practice",
        description: "Evaluate production trade-offs in accessibility, rendering, performance, native APIs, and safe DOM construction."
      }
    ],
    css: [
      {
        level: "A",
        topic: "foundations",
        title: "CSS Foundations",
        description: "Review CSS rule syntax, selectors, values, units, the box model, and core layout concepts."
      },
      {
        level: "B",
        topic: "foundations",
        title: "CSS Applied Practice",
        description: "Apply cascade layers, responsive layout, Grid and flexbox sizing, container queries, and motion preferences."
      },
      {
        level: "C",
        topic: "foundations",
        title: "CSS Engineering Practice",
        description: "Evaluate cascade architecture, design tokens, accessibility, browser support, rendering cost, and maintainable component contracts."
      }
    ],
    javascript: [
      {
        level: "A",
        topic: "fundamentals",
        title: "JavaScript Foundations",
        description: "Review values, scope, operators, functions, arrays, objects, modules, and core syntax."
      },
      {
        level: "B",
        topic: "fundamentals",
        title: "JavaScript Applied Practice",
        description: "Apply collection methods, DOM events, modules, fetch, Promises, and browser scheduling."
      },
      {
        level: "C",
        topic: "fundamentals",
        title: "JavaScript Engineering Practice",
        description: "Evaluate asynchronous reliability, safe DOM updates, lifecycle cleanup, performance, workers, and testing."
      }
    ],
    python: [
      {
        level: "A",
        topic: "fundamentals",
        title: "Python Foundations",
        description: "Review indentation, built-in types, collections, control flow, functions, modules, and basic classes."
      },
      {
        level: "B",
        topic: "fundamentals",
        title: "Python Applied Practice",
        description: "Apply slicing, comprehensions, generators, exceptions, decorators, dataclasses, and standard library tools."
      },
      {
        level: "C",
        topic: "fundamentals",
        title: "Python Engineering Practice",
        description: "Evaluate typing, packaging, pytest, concurrency, memory trade-offs, security, and production service design."
      }
    ],
    dart: [
      {
        level: "A",
        topic: "fundamentals",
        title: "Dart Foundations",
        description: "Review sound null safety, variables, built-in types, functions, collections, classes, and pub basics."
      },
      {
        level: "B",
        topic: "fundamentals",
        title: "Dart Applied Practice",
        description: "Apply null-aware operators, collection if/for, mixins, extensions, futures, streams, and Dart 3 patterns."
      },
      {
        level: "C",
        topic: "fundamentals",
        title: "Dart Engineering Practice",
        description: "Evaluate flow promotion, isolates, sealed exhaustiveness, stream lifecycle, AOT compilation, and CI tooling."
      }
    ],
    tscript: [
      {
        level: "A",
        topic: "fundamentals",
        title: "TypeScript Foundations",
        description: "Review static type annotations, interfaces, unions, tuples, strict null checks, and tsconfig basics."
      },
      {
        level: "B",
        topic: "fundamentals",
        title: "TypeScript Applied Practice",
        description: "Apply generics, type narrowing, discriminated unions, utility types, satisfies, and type predicates."
      },
      {
        level: "C",
        topic: "fundamentals",
        title: "TypeScript Engineering Practice",
        description: "Evaluate mapped and conditional types, boundary validation, strict compiler flags, module resolution, and migration."
      }
    ],
    react: [
      {
        level: "A",
        topic: "fundamentals",
        title: "React Foundations",
        description: "Review components, JSX rules, props, lists and keys, useState, events, and unidirectional data flow."
      },
      {
        level: "B",
        topic: "fundamentals",
        title: "React Applied Practice",
        description: "Apply functional state updates, useEffect cleanup, refs, controlled forms, Context, and memoization."
      },
      {
        level: "C",
        topic: "fundamentals",
        title: "React Engineering Practice",
        description: "Evaluate SSR/hydration, re-render isolation, race-free async effects, virtualization, accessibility, and testing."
      }
    ],
    vue: [
      {
        level: "A",
        topic: "fundamentals",
        title: "Vue Foundations",
        description: "Review SFC structure, template directives, ref and reactive, computed, props/emits, slots, and Vue Router basics."
      },
      {
        level: "B",
        topic: "fundamentals",
        title: "Vue Applied Practice",
        description: "Apply composables, watch cleanup, Pinia stores, defineModel, KeepAlive, Teleport, and route navigation guards."
      },
      {
        level: "C",
        topic: "fundamentals",
        title: "Vue Engineering Practice",
        description: "Evaluate SSR hydration, shallowRef, effectScope, optimistic rollback, vue-tsc, XSS safety, and production observability."
      }
    ],
    flutter: [
      {
        level: "A",
        topic: "fundamentals",
        title: "Flutter Foundations",
        description: "Review StatelessWidget and StatefulWidget, Material layout widgets, Flex alignment, ListView.builder, and assets."
      },
      {
        level: "B",
        topic: "fundamentals",
        title: "Flutter Applied Practice",
        description: "Apply widget lifecycles, controllers, forms, FutureBuilder, LayoutBuilder, InheritedWidget, and navigation."
      },
      {
        level: "C",
        topic: "fundamentals",
        title: "Flutter Engineering Practice",
        description: "Evaluate the three trees, keys, isolates, slivers, RepaintBoundary, accessibility, testing, and release builds."
      }
    ],
    wasm: [
      {
        level: "A",
        topic: "fundamentals",
        title: "WebAssembly Foundations",
        description: "Review WAT/Wasm modules, scalar types, stack execution, linear memory, imports/exports, and WASI basics."
      },
      {
        level: "B",
        topic: "fundamentals",
        title: "WebAssembly Applied Practice",
        description: "Apply structured control flow, memory loads/stores, tables, streaming instantiation, and JS/Wasm data passing."
      },
      {
        level: "C",
        topic: "fundamentals",
        title: "WebAssembly Engineering Practice",
        description: "Evaluate boundary batching, memory growth, SIMD, threads, Component Model, CSP, and sandboxed runtimes."
      }
    ],
    svelte: [
      {
        level: "A",
        topic: "fundamentals",
        title: "Svelte Foundations",
        description: "Review compiler-first reactivity, SFC structure, template blocks, runes, bindings, stores, and scoped CSS."
      },
      {
        level: "B",
        topic: "fundamentals",
        title: "Svelte Applied Practice",
        description: "Apply $derived, $effect cleanup, snippets, actions, transitions, keyed lists, and SvelteKit loaders."
      },
      {
        level: "C",
        topic: "fundamentals",
        title: "Svelte Engineering Practice",
        description: "Evaluate SSR isolation, hydration, $state.raw, security boundaries, compiler a11y checks, and CI testing."
      }
    ],
    ruby: [
      {
        level: "A",
        topic: "fundamentals",
        title: "Ruby Foundations",
        description: "Review truthiness, symbols, collections, ranges, methods, classes, attr accessors, and Bundler basics."
      },
      {
        level: "B",
        topic: "fundamentals",
        title: "Ruby Applied Practice",
        description: "Apply blocks, yield, Proc vs lambda, Enumerable, mixins, exception clauses, and regex anchors."
      },
      {
        level: "C",
        topic: "fundamentals",
        title: "Ruby Engineering Practice",
        description: "Evaluate GVL concurrency, frozen string literals, N+1 queries, safe deserialization, YJIT, and CI security."
      }
    ],
    php: [
      {
        level: "A",
        topic: "fundamentals",
        title: "PHP Foundations",
        description: "Review PHP syntax, scalar types, strict comparisons, arrays, functions, classes, and Composer basics."
      },
      {
        level: "B",
        topic: "fundamentals",
        title: "PHP Applied Practice",
        description: "Apply strict_types, match, nullsafe operators, constructor promotion, enums, PDO, and PSR-4 autoloading."
      },
      {
        level: "C",
        topic: "fundamentals",
        title: "PHP Engineering Practice",
        description: "Evaluate SQLi/XSS/CSRF defenses, OPcache, PHP-FPM tuning, streaming I/O, PHPStan, and production security."
      }
    ],
    node: [
      {
        level: "A",
        topic: "fundamentals",
        title: "Node.js Foundations",
        description: "Review V8 and libuv, ESM vs CommonJS, node: built-ins, fs/promises, http.createServer, and npm lockfiles."
      },
      {
        level: "B",
        topic: "fundamentals",
        title: "Node.js Applied Practice",
        description: "Apply event loop scheduling, streams and pipeline, AbortSignal, EventEmitter, child_process, and node:test."
      },
      {
        level: "C",
        topic: "fundamentals",
        title: "Node.js Engineering Practice",
        description: "Evaluate worker_threads, backpressure, graceful shutdown, prototype pollution, heap limits, and observability."
      }
    ],
    c: [
      {
        level: "A",
        topic: "fundamentals",
        title: "C Foundations",
        description: "Review compilation stages, main signatures, format specifiers, stdint types, control flow, arrays, and C strings."
      },
      {
        level: "B",
        topic: "fundamentals",
        title: "C Applied Practice",
        description: "Apply pointers and arithmetic, structs and unions, bitwise masks, dynamic allocation, stdio files, and function pointers."
      },
      {
        level: "C",
        topic: "fundamentals",
        title: "C Engineering Practice",
        description: "Evaluate undefined behavior, alignment, restrict/volatile/atomics, safe realloc, sanitizers, and systems-level safety."
      }
    ],
    cpp: [
      {
        level: "A",
        topic: "fundamentals",
        title: "C++ Foundations",
        description: "Review namespaces, nullptr, references, const/constexpr, std::vector and std::string, classes, and range-based for."
      },
      {
        level: "B",
        topic: "fundamentals",
        title: "C++ Applied Practice",
        description: "Apply RAII, smart pointers, Rule of Zero/Five, virtual/override, STL containers, lambdas, std::optional, and templates."
      },
      {
        level: "C",
        topic: "fundamentals",
        title: "C++ Engineering Practice",
        description: "Evaluate move/forward semantics, string_view/span lifetimes, concepts/ranges, atomics/jthread, Pimpl, and sanitizers."
      }
    ],
    rust: [
      {
        level: "A",
        topic: "fundamentals",
        title: "Rust Foundations",
        description: "Review Cargo, ownership and borrowing, Copy vs move, String vs &str, structs, enums, match, and Option."
      },
      {
        level: "B",
        topic: "fundamentals",
        title: "Rust Applied Practice",
        description: "Apply Result and ?, traits and generics, impl vs dyn Trait, lifetimes, iterators, closures, and modules."
      },
      {
        level: "C",
        topic: "fundamentals",
        title: "Rust Engineering Practice",
        description: "Evaluate Rc/Arc/RefCell, Send/Sync, async Pin and cancellation, unsafe FFI invariants, Cow, and Miri."
      }
    ]
  };
  const trackTitles = {
    go: "Go",
    html: "HTML",
    css: "CSS",
    javascript: "JavaScript",
    python: "Python",
    dart: "Dart",
    tscript: "TypeScript",
    react: "React",
    vue: "Vue",
    flutter: "Flutter",
    wasm: "WebAssembly",
    svelte: "Svelte",
    ruby: "Ruby",
    php: "PHP",
    node: "Node.js",
    c: "C",
    cpp: "C++",
    rust: "Rust"
  };

  function titleCase(track) {
    return track.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
  }

  function start() {
    const params = new URLSearchParams(window.location.search);
    const track = params.get("track");
    const error = document.getElementById("quiz-catalog-error");
    const list = document.getElementById("quiz-set-list");
    const template = document.getElementById("quiz-card-template");
    const trackTitle = Object.prototype.hasOwnProperty.call(trackTitles, track)
      ? trackTitles[track]
      : titleCase(track || "");

    if (!identifierPattern.test(track || "")) {
      error.hidden = false;
      error.textContent = "This roadmap link is invalid. Return to the roadmap and open its quiz page again.";
      list.hidden = true;
      return;
    }

    document.title = `${trackTitle} Quizzes | Sage-Code`;
    document.getElementById("quiz-catalog-title").textContent = `${trackTitle} Quizzes`;
    document.getElementById("quiz-catalog-description").textContent =
      `These quizzes measure how well you recall, apply, and reason about ${trackTitle} concepts. Set A checks foundations, Set B combines core techniques, and Set C tests engineering judgment. Use the results to identify gaps and guide further study. Each quiz allows two minutes per question.`;
    document.getElementById("roadmap-return-link").href = `/roadmap/${track}/`;
    document.getElementById("roadmap-return-link").textContent = `Return to the ${trackTitle} roadmap`;

    let statuses;
    try {
      statuses = window.RoadmapQuiz.readQuizStatuses(window.localStorage);
    } catch (readError) {
      error.hidden = false;
      error.textContent = `Quiz status could not be read from this browser: ${readError.message || String(readError)}`;
      statuses = null;
    }

    const sets = Object.prototype.hasOwnProperty.call(quizSetsByTrack, track)
      ? quizSetsByTrack[track]
      : ["A", "B", "C"].map((level) => ({
        level,
        title: `Quiz ${level}`,
        description: "Quiz content for this roadmap has not been published yet."
      }));

    sets.forEach((quizSet) => {
      const card = template.content.firstElementChild.cloneNode(true);
      const statusBadge = card.querySelector(".quiz-set-status");
      const startLink = card.querySelector(".quiz-set-start");
      const savedStatus = statuses && quizSet.topic
        ? statuses[`${track}-${quizSet.topic}-${quizSet.level}`]
        : null;
      const status = savedStatus ? savedStatus.status : "none";
      const validStatus = statuses !== null && Object.prototype.hasOwnProperty.call(statusLabels, status);

      card.querySelector("[data-quiz-set-title]").textContent = quizSet.title;
      card.querySelector("[data-quiz-set-description]").textContent = quizSet.description;
      statusBadge.textContent = validStatus ? statusLabels[status] : "Unavailable";
      statusBadge.className = `quiz-set-status badge ${validStatus ? statusClasses[status] : "text-bg-warning"}`;

      if (quizSet.topic) {
        startLink.href = `/roadmap/quiz.html?track=${track}&topic=${quizSet.topic}&level=${quizSet.level}`;
      } else {
        startLink.removeAttribute("href");
        startLink.classList.add("disabled");
        startLink.setAttribute("aria-disabled", "true");
        startLink.title = "Quiz content for this roadmap has not been published yet.";
      }

      list.append(card);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
