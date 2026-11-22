# 04_procedures.nim — procs, parameters and first-class functions.
#
# Run it with:  nim c -r 04_procedures.nim
#
# A `proc` is Nim's routine: checked, compiled, and callable before its
# definition when the signature is visible. Nim also has `func` (a proc that
# may not have side effects, enforced by the compiler) — use it for pure
# helpers, and `proc` when you need to mutate state or do I/O.

import std/strutils

# Parameters may carry a default. The last expression is the return value, and
# a `##` comment right under the signature is documentation, not decoration:
# `nim doc 04_procedures.nim` renders it as the proc's help text.
proc greet(name: string; punctuation = "!"): string =
  ## Greet one person, optionally with custom punctuation.
  "Hello, " & name & punctuation

# Named arguments make call sites self-documenting; order no longer matters.
echo greet("Ada")
echo greet(punctuation = "?", name = "Grace")

# Every proc has an implicit `result` variable with the return type. Returning
# inside a loop is fine, but accumulating into `result` reads better.
proc total(values: openArray[int]): int =
  for v in values:
    result += v

# Multiple values come back as a tuple; callers destructure or index it.
proc minMax(values: openArray[int]): (int, int) =
  var lo = values[0]
  var hi = values[0]
  for v in values:
    lo = min(lo, v)
    hi = max(hi, v)
  (lo, hi)

# `var` parameters are mutable references to the caller's variable. This is the
# explicit, visible way to mutate an argument — a plain parameter is a copy.
proc double(x: var int) =
  x *= 2

# Overloading is resolved by the argument types, so one name can serve several
# shapes. `{.discardable.}` marks a proc whose result may be ignored.
proc describe(x: int): string {.discardable.} = "int " & $x
proc describe(x: string): string {.discardable.} = "string " & x
proc describe(x: (int, int)): string {.discardable.} = "pair " & $x

# Procs are first-class values: pass them, store them, return them. A proc type
# is written as `proc(args): result`.
proc apply(f: proc(a: int): int; value: int): int = f(value)
proc squarer(x: int): int = x * x

let data = [4, 8, 15, 16, 23, 42]
let (lo, hi) = minMax(data)
echo "total=", total(data), " min=", lo, " max=", hi

var counter = 7
double(counter)
echo "double(7) -> ", counter

echo describe(3), " | ", describe("three"), " | ", describe(minMax(data))
echo "apply squarer = ", apply(squarer, 9)

# An anonymous proc (lambda) is written inline. Use it for short one-off logic;
# a named proc is better the moment it needs a comment.
echo "apply lambda = ", apply(proc(a: int): int = a + 100, 1)
