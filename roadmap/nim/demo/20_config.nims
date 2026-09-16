# 20_config.nims — project build configuration, executed by the compiler.
#
# A `.nims` file is Nim code run in the compiler's own virtual machine before
# (and instead of ever being part of) the program. The compiler looks for
# `config.nims` next to the main `.nim` file, then in the per-user config
# directory, so build flags live in version control instead of in every
# developer's shell history.
#
# This copy is kept under demo/ so you can read it in the code viewer and copy
# it into a project; the file that a project actually uses must be named
# `config.nims` in the project root.
#
# Equivalent command line, for reference:
#   nim c --path:src --path:tests -d:featureX --warningAsError:UnusedImport src/app.nim

import std/os                       # NimScript can use parts of the stdlib

# ---------------------------------------------------------------------------
# 1. Project layout — where `import` looks for modules
# ---------------------------------------------------------------------------
switch("path", "src")               # local packages live in src/
switch("path", "tests")             # test helpers are importable too
switch("nimcache", ".nimcache")     # keep the generated C out of the repo root

# ---------------------------------------------------------------------------
# 2. Mode-dependent options — one file, several builds
# ---------------------------------------------------------------------------
# The defines come from the command line, so the branches below stay identical
# whether CI runs `nim c -d:release src/app.nim` or a developer runs `nim c`.
when defined(release) or defined(danger):
  switch("opt", "speed")            # equivalent to --opt:speed
  switch("stackTrace", "off")
  switch("lineTrace", "off")
  switch("passL", "-s")             # ask the C linker to strip symbols
else:
  switch("stackTrace", "on")
  switch("lineTrace", "on")
  switch("hint", "Processing:off")  # a quiet, fast edit-compile loop
  switch("hint", "ExtendedContext:off")

when defined(linux):
  switch("passC", "-Wall")          # forward flags to the C compiler
elif defined(windows):
  switch("define", "unicode")       # a define many Windows C headers expect

# ---------------------------------------------------------------------------
# 3. Quality gates for CI — fail the build instead of printing a warning
# ---------------------------------------------------------------------------
switch("warningAsError", "UnusedImport")
switch("warningAsError", "Deprecated")

# `--panics:on` turns check failures into aborts; the right default for a
# service that must not continue after an internal inconsistency.
when defined(ci):
  switch("panics", "on")

# ---------------------------------------------------------------------------
# 4. Defines that the source can read with `when defined(featureX)` — this is
#    how optional functionality is enabled per build without editing code.
# ---------------------------------------------------------------------------
switch("define", "appVersion=2.0.0")
when defined(windows):
  switch("define", "winGui")

# ---------------------------------------------------------------------------
# 5. Tasks — automation stored with the build, run as `nim <task> config.nims`
# ---------------------------------------------------------------------------
task build, "Compile the release binary into build/":
  exec "nim c -d:release --outdir:build src/app.nim"

task test, "Compile and run the whole test suite":
  exec "nim c -r --path:src --path:tests tests/all_tests.nim"

task clean, "Remove build products and the Nim cache":
  removeDir("build")
  removeDir(".nimcache")

task check, "Treat warnings as errors and only report problems":
  exec "nim check --warningAsError:UnusedImport src/app.nim"

# Task names are symbols in this file's scope, so they must come last: a `task`
# declared after use would shadow nothing, but keeping them together makes the
# available commands obvious at a glance.
