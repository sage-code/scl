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
    ],
    assembly: [
      {
        level: "A",
        topic: "fundamentals",
        title: "Assembly Foundations",
        description: "Review x86-64 registers, Intel vs AT&T syntax, ELF sections, two's complement, mov vs lea, cmp, and branches."
      },
      {
        level: "B",
        topic: "fundamentals",
        title: "Assembly Applied Practice",
        description: "Apply SIB addressing, little-endian memory, stack frames, System V ABI, bitwise shifts, syscalls, and GDB."
      },
      {
        level: "C",
        topic: "fundamentals",
        title: "Assembly Engineering Practice",
        description: "Evaluate 16-byte stack alignment, Red Zone, PIC/RIP-relative, cmov, SSE/AVX, lock atomics, and binary mitigations."
      }
    ],
    bash: [
      {
        level: "A",
        topic: "fundamentals",
        title: "Bash Foundations",
        description: "Review shebangs, quoting, exit codes, $() substitution, conditionals, loops, functions, and PATH."
      },
      {
        level: "B",
        topic: "fundamentals",
        title: "Bash Applied Practice",
        description: "Apply parameter expansion, indexed/associative arrays, redirections, process substitution, find/xargs, and getopts."
      },
      {
        level: "C",
        topic: "fundamentals",
        title: "Bash Engineering Practice",
        description: "Evaluate strict mode (set -euo pipefail), trap cleanup, mktemp, flock, safe command arrays, and shellcheck."
      }
    ],
    swift: [
      {
        level: "A",
        topic: "fundamentals",
        title: "Swift Foundations",
        description: "Review let vs var, Optionals, guard/if let, collections, ranges, switch exhaustiveness, and struct vs class."
      },
      {
        level: "B",
        topic: "fundamentals",
        title: "Swift Applied Practice",
        description: "Apply Copy-on-Write, mutating methods, closures, Codable, protocol extensions, generics, and throws/defer."
      },
      {
        level: "C",
        topic: "fundamentals",
        title: "Swift Engineering Practice",
        description: "Evaluate ARC weak/unowned, actors and Sendable, some vs any, async/await cancellation, macros, and ~Copyable."
      }
    ],
    julia: [
      {
        level: "A",
        topic: "fundamentals",
        title: "Julia Foundations",
        description: "Review 1-based indexing, column-major arrays, nothing vs missing, strings, structs, tuples, and Pkg."
      },
      {
        level: "B",
        topic: "fundamentals",
        title: "Julia Applied Practice",
        description: "Apply multiple dispatch, parametric types, dot broadcasting, do-blocks, generators, Test, and Threads.@threads."
      },
      {
        level: "C",
        topic: "fundamentals",
        title: "Julia Engineering Practice",
        description: "Evaluate type stability (@code_warntype), @views and .= fusion, macros, Threads.@spawn, ccall, and TTFX."
      }
    ],
    csharp: [
      {
        level: "A",
        topic: "fundamentals",
        title: "C# Foundations",
        description: "Review CLR/IL, value vs reference types, decimal, nullable references, TryParse, collections, and switch expressions."
      },
      {
        level: "B",
        topic: "fundamentals",
        title: "C# Applied Practice",
        description: "Apply records and init/required, pattern matching, IDisposable/using, LINQ vs IQueryable, delegates, and yield."
      },
      {
        level: "C",
        topic: "fundamentals",
        title: "C# Engineering Practice",
        description: "Evaluate async/await ValueTask, DI lifetimes, Span/ArrayPool, Channels, source generators, and .NET GC."
      }
    ],
    java: [
      {
        level: "A",
        topic: "fundamentals",
        title: "Java Foundations",
        description: "Review JVM bytecode, primitives vs wrappers, BigDecimal, String immutability, var, switch, and records."
      },
      {
        level: "B",
        topic: "fundamentals",
        title: "Java Applied Practice",
        description: "Apply try-with-resources, equals/hashCode, sealed interfaces, PECS generics, Optional, and Streams."
      },
      {
        level: "C",
        topic: "fundamentals",
        title: "Java Engineering Practice",
        description: "Evaluate JMM volatile, Virtual Threads, ConcurrentHashMap, CompletableFuture, ThreadLocal, and JVM GC."
      }
    ],
    scala: [
      {
        level: "A",
        topic: "fundamentals",
        title: "Scala Foundations",
        description: "Review val vs var, lazy val, type hierarchy, string interpolators, case classes, Option, and immutable collections."
      },
      {
        level: "B",
        topic: "fundamentals",
        title: "Scala Applied Practice",
        description: "Apply for-comprehensions, sealed ADTs, Either/Try, given/using, opaque types, variance, and trait linearization."
      },
      {
        level: "C",
        topic: "fundamentals",
        title: "Scala Engineering Practice",
        description: "Evaluate @tailrec, Future vs IO, LazyList vs Iterator, ClassTag, inline macros, TASTy, and binary compatibility."
      }
    ],
    plsql: [
      {
        level: "A",
        topic: "fundamentals",
        title: "PL/SQL Foundations",
        description: "Review DECLARE/BEGIN/EXCEPTION blocks, %TYPE/%ROWTYPE, NULL logic, loops, SELECT INTO, and transactions."
      },
      {
        level: "B",
        topic: "fundamentals",
        title: "PL/SQL Applied Practice",
        description: "Apply cursors, SYS_REFCURSOR, packages, collections, BULK COLLECT/FORALL, triggers, and compound triggers."
      },
      {
        level: "C",
        topic: "fundamentals",
        title: "PL/SQL Engineering Practice",
        description: "Evaluate context switching, bind variables, AUTHID/RESULT_CACHE, pipelined functions, EBR, and profiling."
      }
    ],
    kotlin: [
      {
        level: "A",
        topic: "fundamentals",
        title: "Kotlin Foundations",
        description: "Review val/var, type inference, nullability, safe calls, Elvis, when expressions, ranges, and data classes."
      },
      {
        level: "B",
        topic: "fundamentals",
        title: "Kotlin Applied Practice",
        description: "Apply smart casts, scope functions, extension functions, sealed hierarchies, collections, and suspend basics."
      },
      {
        level: "C",
        topic: "fundamentals",
        title: "Kotlin Engineering Practice",
        description: "Evaluate structured concurrency, Flow, inline/reified generics, value classes, Java interop, and immutability."
      }
    ],
    nim: [
      {
        level: "A",
        topic: "fundamentals",
        title: "Nim Foundations",
        description: "Review var/let/const, indentation, UFCS, ranges, procs, result, arrays/seqs, objects, and std/strformat."
      },
      {
        level: "B",
        topic: "fundamentals",
        title: "Nim Applied Practice",
        description: "Apply distinct types, object variants, iterators, templates, generics, Option, exceptions, and std/unittest."
      },
      {
        level: "C",
        topic: "fundamentals",
        title: "Nim Engineering Practice",
        description: "Evaluate ARC/ORC, sink/lent move semantics, macros, effect pragmas, C FFI interop, async, and release modes."
      }
    ],
    zig: [
      {
        level: "A",
        topic: "fundamentals",
        title: "Zig Foundations",
        description: "Review const/var, explicit integer widths, slices, optionals, defer, switch exhaustiveness, and structs."
      },
      {
        level: "B",
        topic: "fundamentals",
        title: "Zig Applied Practice",
        description: "Apply error unions, try/catch/errdefer, pointers, tagged unions, comptime generics, and std.testing."
      },
      {
        level: "C",
        topic: "fundamentals",
        title: "Zig Engineering Practice",
        description: "Evaluate explicit allocators, arenas, OOM testing, build.zig, C interop, packed/extern structs, and build modes."
      }
    ],
    fortran: [
      {
        level: "A",
        topic: "fundamentals",
        title: "Fortran Foundations",
        description: "Review implicit none, iso_fortran_env kinds, 1-based arrays, do loops, select case, and module basics."
      },
      {
        level: "B",
        topic: "fundamentals",
        title: "Fortran Applied Practice",
        description: "Apply column-major layout, intent contracts, pure/elemental procs, allocatables, stream I/O, and derived types."
      },
      {
        level: "C",
        topic: "fundamentals",
        title: "Fortran Engineering Practice",
        description: "Evaluate submodules, OOP, iso_c_binding, f2py, OpenMP, coarrays, MPI, GPU offload, and SIMD performance."
      }
    ],
    ada: [
      {
        level: "A",
        topic: "fundamentals",
        title: "Ada Foundations",
        description: "Review .ads/.adb splits, Alire/GPRbuild, strong typing, ranges, modular types, short-circuit logic, case, and loops."
      },
      {
        level: "B",
        topic: "fundamentals",
        title: "Ada Applied Practice",
        description: "Apply unconstrained arrays, attributes, variant records, limited private types, generics, exceptions, and streams."
      },
      {
        level: "C",
        topic: "fundamentals",
        title: "Ada Engineering Practice",
        description: "Evaluate tagged OOP, Ada 2012 contracts, SPARK/GNATprove, tasking, protected objects, Ravenscar, and C interop."
      }
    ],
    elixir: [
      {
        level: "A",
        topic: "fundamentals",
        title: "Elixir Foundations",
        description: "Review BEAM/Mix/IEx, modules and arity, pipes, immutable data, pattern matching, guards, sigils, and structs."
      },
      {
        level: "B",
        topic: "fundamentals",
        title: "Elixir Applied Practice",
        description: "Apply closures, Enum/Stream, comprehensions, protocols vs behaviours, tagged tuples, binaries, macros, ExUnit, and Mox."
      },
      {
        level: "C",
        topic: "fundamentals",
        title: "Elixir Engineering Practice",
        description: "Evaluate BEAM processes, Task/Agent/GenServer, Supervisors, releases, Ecto, Phoenix LiveView, ETS, and Telemetry."
      }
    ],
    odin: [
      {
        level: "A",
        topic: "fundamentals",
        title: "Odin Foundations",
        description: "Review explicitness, toolchain commands, declarations, zero-init, distinct types, operators, when/switch, and for loops."
      },
      {
        level: "B",
        topic: "fundamentals",
        title: "Odin Applied Practice",
        description: "Apply multiple returns, defer, or_return/or_else, structs/unions/bit_sets, slices, dynamic arrays, maps, pointers, and generics."
      },
      {
        level: "C",
        topic: "fundamentals",
        title: "Odin Engineering Practice",
        description: "Evaluate implicit context, custom/temp/arena allocators, #soa data-oriented design, C FFI, core:thread/sync, and testing."
      }
    ],
    cse: [
      {
        level: "A",
        topic: "fundamentals",
        title: "CSE Foundations",
        description: "Review stack/heap memory, lexical scope, binary/hex, Boolean algebra, bit masks, compilation tiers, prompt anatomy, and Git."
      },
      {
        level: "B",
        topic: "fundamentals",
        title: "CSE Applied Practice",
        description: "Apply MPA/SPA/SSG/SSR, CSS box model, GoF design patterns, SDLC/Agile, testing pyramid, security basics, and cloud/12-factor."
      },
      {
        level: "C",
        topic: "fundamentals",
        title: "CSE Engineering Practice",
        description: "Evaluate SLOs/p99 latency, scaling, load balancing, caching, CAP/PACELC, queues/circuit breakers, architectures, and LLM evals."
      }
    ],
    dsa: [
      {
        level: "A",
        topic: "fundamentals",
        title: "DSA Foundations",
        description: "Review loop invariants, Big-O/amortized analysis, recursion, Go slice internals, two pointers, linked lists, stacks, and queues."
      },
      {
        level: "B",
        topic: "fundamentals",
        title: "DSA Applied Practice",
        description: "Apply hash tables, BSTs, binary heaps, binary search, sorting stability, BFS/DFS, topological sort, Union-Find, and shortest paths."
      },
      {
        level: "C",
        topic: "fundamentals",
        title: "DSA Engineering Practice",
        description: "Evaluate greedy proofs, dynamic programming, backtracking, tries/segment/Fenwick trees, KMP, Bloom filters, LRU caches, and sharded maps."
      }
    ],
    pgp: [
      {
        level: "A",
        topic: "fundamentals",
        title: "PGP Foundations",
        description: "Review linear, structured, OOP, and functional paradigms: Böhm-Jacopini, encapsulation, Smalltalk/Self/Eiffel, purity, closures, and ADTs."
      },
      {
        level: "B",
        topic: "fundamentals",
        title: "PGP Applied Practice",
        description: "Apply logic/ASP (Prolog, Datalog, Clingo), AOP, Web Components/OSGi, Actor/CSP concurrency, RxJS/Elm reactive, and array programming."
      },
      {
        level: "C",
        topic: "fundamentals",
        title: "PGP Engineering Practice",
        description: "Evaluate multi-paradigm hybrid design (Julia, Rust, C#, Scala, Kotlin, Swift, F#), Functional Core/Imperative Shell, and type trade-offs."
      }
    ],
    tek: [
      {
        level: "A",
        topic: "fundamentals",
        title: "TechOps Foundations",
        description: "Review SLIs/SLOs/SLAs, Linux permissions, systemd, Bash safety, TCP/IP, DNS, HTTP/TLS, and networking diagnostics."
      },
      {
        level: "B",
        topic: "fundamentals",
        title: "TechOps Applied Practice",
        description: "Apply CI/CD gates, blue-green/canary rollouts, containers vs VMs, multi-stage builds, IaC state locking, IAM, and cloud cost controls."
      },
      {
        level: "C",
        topic: "fundamentals",
        title: "TechOps Engineering Practice",
        description: "Evaluate metrics/logs/traces, Golden Signals, blameless postmortems, error budgets, circuit breakers, secret rotation, and hardening."
      }
    ],
    dba: [
      {
        level: "A",
        topic: "fundamentals",
        title: "DBA Foundations",
        description: "Review SQL statement families, normalization, keys and constraints, B-tree indexes, ACID properties, least-privilege roles, and RPO/RTO."
      },
      {
        level: "B",
        topic: "fundamentals",
        title: "DBA Applied Practice",
        description: "Apply joins, CTEs, window functions, upserts, composite/partial/expression indexes, EXPLAIN buffers, isolation levels, RLS, and PITR."
      },
      {
        level: "C",
        topic: "fundamentals",
        title: "DBA Engineering Practice",
        description: "Evaluate plan regressions, lock contention, expand-and-contract migrations, partitioning, replication lag, pooling, and capacity planning."
      }
    ],
    sml: [
      {
        level: "A",
        topic: "fundamentals",
        title: "SML Foundations",
        description: "Review data lifecycles, distributions, encoding, train/test splits, overfitting, precision/recall, and data governance."
      },
      {
        level: "B",
        topic: "fundamentals",
        title: "SML Applied Practice",
        description: "Apply leak-free pipelines, stratification, tree ensembles, A/B testing, regularization, PR-AUC, and cross-validation."
      },
      {
        level: "C",
        topic: "fundamentals",
        title: "SML Engineering Practice",
        description: "Evaluate feature stores, point-in-time joins, drift monitoring, shadow/canary rollouts, fairness slices, and LLM guardrails."
      }
    ],
    hpc: [
      {
        level: "A",
        topic: "fundamentals",
        title: "HPC Foundations",
        description: "Review CPU caches, GPUs/VRAM, PCIe vs SATA, NVMe vs HDD, ECC memory, PSUs/UPS, RAID vs backups, and L2/L3 networking."
      },
      {
        level: "B",
        topic: "fundamentals",
        title: "HPC Applied Practice",
        description: "Apply NUMA awareness, RAID trade-offs, thermal/power diagnostics, SMART/ethtool checks, jumbo frames, and hardware burn-in."
      },
      {
        level: "C",
        topic: "fundamentals",
        title: "HPC Engineering Practice",
        description: "Evaluate 2N power redundancy, EDAC/AER fault triage, P2P GPU topology, ZFS scrubs, immutability, Redfish isolation, and TCO."
      }
    ],
    osd: [
      {
        level: "A",
        topic: "fundamentals",
        title: "OSD Foundations",
        description: "Review OSI licenses, community health files, fork/PR workflow, SemVer, changelogs, CI test layers, and private security reporting."
      },
      {
        level: "B",
        topic: "fundamentals",
        title: "OSD Applied Practice",
        description: "Apply git bisect, constructive reviews, scoped stale triage, pinned CI actions, cherry-pick backports, and Diátaxis docs."
      },
      {
        level: "C",
        topic: "fundamentals",
        title: "OSD Engineering Practice",
        description: "Evaluate coordinated CVE disclosure, supply-chain SBOMs, bus-factor governance, RFCs, reproducible builds, and maintainer handovers."
      }
    ],
    dsl: [
      {
        level: "A",
        topic: "fundamentals",
        title: "DSL Foundations",
        description: "Review external vs internal DSLs, lexers/parsers, EBNF, ASTs vs CSTs, scoping, semantic analysis, IR/SSA, and declarative DSLs."
      },
      {
        level: "B",
        topic: "fundamentals",
        title: "DSL Applied Practice",
        description: "Apply associativity, Pratt/LR parsing, stack vs register VMs, safe optimizations, Verilog/Triton/Julia/Clingo models, and TCO."
      },
      {
        level: "C",
        topic: "fundamentals",
        title: "DSL Engineering Practice",
        description: "Evaluate span-based recovery, LSP/query compilers, multi-level IR, sandboxed metering, AOT vs JIT, and differential/fuzz testing."
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
    rust: "Rust",
    assembly: "Assembly",
    bash: "Bash",
    swift: "Swift",
    julia: "Julia",
    csharp: "C#",
    java: "Java",
    scala: "Scala",
    plsql: "PL/SQL",
    kotlin: "Kotlin",
    nim: "Nim",
    zig: "Zig",
    fortran: "Fortran",
    ada: "Ada",
    elixir: "Elixir",
    odin: "Odin",
    cse: "CSE",
    dsa: "DSA",
    pgp: "PGP",
    tek: "TechOps",
    dba: "DBA",
    sml: "SML",
    hpc: "HPC",
    osd: "OSD",
    dsl: "DSL"
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
