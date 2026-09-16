# 10_modules.nim — modules, imports and the program entry point.
#
# Run it with:  nim c -r 10_modules.nim
#
# Every `.nim` file is a module, and its name is its namespace: `mathutils.nim`
# is imported as `mathutils`. Unlike C headers there is no declaration/definition
# split and no include order to get wrong — the compiler compiles the module
# graph it discovers. Everything is public by default; `*` marks what may leave
# the module, so the absence of `*` is your encapsulation.
#
# (This demo deliberately uses only standard-library modules so it stays a
# single file. In a real project you would write `import mathutils` next to it.)

import std/[strutils, os]          # several modules, one statement
import std/times                   # a second style: one module per statement
from std/sequtils import mapIt     # only this symbol enters the namespace
import std/algorithm as alg        # a local alias for a long module name

# A module-level constant is exported with `*`. Constants are compile-time
# values, so consumers can use them to size arrays or in `case` labels.
const
  DemoName* = "modules"
  MaxLines* = 5

# A proc marked with `*` is visible to importers. Procs without `*` stay
# private, even if the caller imports the module — this is real encapsulation.
proc describe*(label: string): string =
  "[" & label.align(12) & "]"

proc internalHelper(x: int): int =     # not exported: an implementation detail
  x * 2

# Module state is initialized once, the first time the module is imported.
# `when isMainModule` guards the code that must run only when THIS file is the
# program entry point — the idiomatic replacement for `if __name__ == "__main__"`.
var runCount = 0

proc bump*(): int =
  ## Increment the module counter and return the new value.
  runCount.inc
  runCount

when isMainModule:
  echo DemoName, " on ", hostOS
  echo "  compiled on ", CompileDate, " at time ", CompileTime

  # Qualified access is explicit and collision-proof; unqualified access is
  # shorter. Both refer to the same symbol.
  let words = ["delta", "alpha", "charlie"]
  let upper = words.mapIt(it.toUpperAscii())
  echo "  mapped: ", upper.join(",")

  var sorted = @[3, 1, 2]
  sorted.sort()                       # `alg.sort` would be the qualified form
  echo "  sorted: ", sorted

  # `from ... import` deliberately hides everything else, which documents the
  # module's true dependency surface: only `mapIt` is used from sequtils.
  echo "  private helper is invisible here — call the public wrapper instead:"
  echo "  ", describe("bumped " & $bump()), " ", describe("bumped " & $bump())

  # `filterIt`, `foldl`, `zip` and friends would need their own import; a missed
  # import is a compile error naming the module that provides the symbol.
  echo "  maxLines=", MaxLines, " lines read below are limited by that constant"

  # Runtime introspection: `getAppFilename` needs `std/os`, which is why it is
  # imported even though nothing else in this demo uses it.
  echo "  running as: ", getAppFilename().lastPathPart
