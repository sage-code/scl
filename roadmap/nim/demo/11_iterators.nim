# 11_iterators.nim — inline and closure iterators.
#
# Run it with:  nim c -r 11_iterators.nim
#
# An `iterator` is a proc that can `yield`. Nim has two kinds and they are very
# different tools:
#   inline iterator  (default) — inlined into the loop body, no state machine,
#                                zero overhead, but cannot be stored or passed
#   closure iterator ({.closure.}) — a first-class heap value with a resumable
#                                state machine; it can be passed around
# Anything that `for` can walk — seqs, arrays, tables, files, your own type —
# exposes an `items`/`pairs` iterator. Repeat that pattern for your own types.

import std/strutils

# 1. Inline iterator built on the `..` range. Because it is inlined, `for` sees
#    plain integer arithmetic and the compiler optimizes it away.
iterator countTo(n: int): int =
  for i in 1 .. n:
    yield i

# 2. Stateful iteration: a Fibonacci stream that stops at a limit. The loop
#    variable is `var` inside the iterator; the caller sees only the yields.
iterator fibonacci(limit: int): int =
  var a, b = 0
  while b <= limit:
    yield b
    (a, b) = (b, a + b)

# 3. `pairs` yields the index as well as the value, and is what `for i, x in`
#    uses. Writing it for your own type makes that type loopable.
type
  Ring = object
    data: seq[int]

iterator pairs(r: Ring): (int, int) =
  for i, v in r.data.pairs:
    yield (i, v * 10)               # transform during iteration, if you like
iterator items(r: Ring): int =
  for _, v in r.pairs:
    yield v

# 4. A closure iterator is stored in a variable and resumed later. It keeps its
#    own state between calls, so it can drive a pipeline or a parser.
proc makeCounter(start: int): iterator (): int =
  var current = start
  result = iterator (): int =
    current += 1
    yield current

let counter = makeCounter(10)       # a value, not a call
echo "closure counter: ", counter(), " ", counter(), " ", counter()

# 5. Inline iterators compose: `takeWhile`-style helpers keep the loop readable.
iterator runningSum(values: openArray[int]): int =
  var acc = 0
  for v in values:
    acc += v
    yield acc

echo "countTo(5): "
for n in countTo(5): stdout.write n, " "
stdout.write "\n"

echo "fibonacci up to 34: "
var fibs: seq[int]
for f in fibonacci(34): fibs.add(f)
echo "  ", fibs.join(", ")

let ring = Ring(data: @[1, 2, 3])
for i, v in ring.pairs: echo "  ring[", i, "] = ", v
echo "  sum of ring items = ", block:
  var s = 0
  for v in ring.items: s += v
  s

for total in runningSum([5, 10, 15]): echo "  running total = ", total
