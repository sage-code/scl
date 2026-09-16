# 14_memory.nim — value vs reference semantics, moves and deterministic cleanup.
#
# Run it with:  nim c -r 14_memory.nim
# The memory manager is chosen at compile time; Nim 2.x defaults to ORC:
#   nim c -r --mm:orc 14_memory.nim    # default: cycle collector on top of ARC
#   nim c -r --mm:arc 14_memory.nim    # reference counting only, no cycles
#
# What to internalize:
#   - `object`, `array`, `seq`, `string` are VALUES: assignment copies them.
#     Passing them to a proc copies too, unless you take them as `openArray`,
#     `var`, `sink` or `lent`.
#   - `ref object` is a heap reference: assignment copies the pointer, and the
#     collector destroys the object when the last reference disappears.
#   - With ARC/ORC, destruction is *deterministic* — no stop-the-world pauses.

import std/strutils

type
  Buffer = ref object
    name: string
    bytes: seq[byte]

# When you need to observe (or replace) that release point, you give the type a
# destructor hook. In Nim 2.x the hook takes a `var` parameter (this changed from
# Nim 1.x, where the parameter was an immutable value):
#
#   proc `=destroy`(b: var Buffer) =
#     echo "release ", b.name          # runs when the value's lifetime ends
#
# Define `=copy` and `=sink` alongside it whenever the type owns a resource, and
# call `wasMoved` in the sink hook so the moved-from value is inert. The demo
# below stays with library types so that it compiles on any Nim 2.x setup.

proc newBuffer(name: string; size: int): Buffer =
  result = Buffer(name: name, bytes: newSeq[byte](size))

# Value semantics: the parameter is a copy. `seq` copies are shallow-copy-on-
# write, so the caller's data is never modified by accident.
proc countBytes(data: seq[byte]): int = data.len

# `openArray` borrows the caller's storage: no copy, and the length travels with
# the pointer. It is the right parameter type for "read this collection".
proc sumBytes(data: openArray[byte]): int =
  for b in data: result += int(b)

# `sink` transfers ownership: no copy and no refcount bump, because the callee
# promises to consume the value. Use it for large payloads you take by value.
proc takeBuffer(b: sink Buffer): string =
  result = b.name & ":" & $b.bytes.len

# `var` gives a mutable borrow — visible at the call site as "this will change".
proc fill(b: var Buffer; value: byte) =
  for i in 0 ..< b.bytes.len: b.bytes[i] = value

# Value semantics for a container: assigning a seq copies the header and shares
# the payload until someone writes, so the two names diverge only on mutation.
var original = @[byte 1, 2, 3]
var duplicate = original
duplicate[0] = 99
echo "original[0]=", original[0], " duplicate[0]=", duplicate[0], " (independent)"

let data = @[byte 1, 2, 3, 4]
echo "value copy length = ", countBytes(data), " (caller's seq untouched)"
echo "borrowed sum      = ", sumBytes(data)

block:
  var owned = newBuffer("scratch", 3)
  owned.fill(0xFF)                        # `fill` borrows, does not consume
  echo "owned bytes       = ", sumBytes(owned.bytes)
  echo "handing off..."
  echo "consumed          = ", takeBuffer(owned)   # ownership moves out
# At the closing brace of this block the last reference to the buffer is gone,
# so ARC/ORC releases it here — deterministic, with no GC pause to wait for.
# (`owned` was moved out, so it is empty and the compiler rejects reading it.)

# Ref semantics: two names, one object. Assignment copies the reference, so a
# mutation through either name is visible through both.
let shared = newBuffer("shared", 2)
var alias = shared
alias.bytes[0] = 9
echo "shared sees alias write: ", shared.bytes[0], " same object? ", alias == shared

# Explicit moves: `move` transfers a value and leaves the source empty. It is
# the tool for reusing a buffer without copying the payload.
var pool = newSeq[int](4)
for i in 0 .. 3: pool[i] = i * i
let taken = move pool
echo "moved seq len = ", taken.len, " source len now = ", pool.len

# Stack vs heap: arrays of fixed size live inline (no allocation at all), while
# sequences and ref objects allocate. Choosing an array where possible is a
# memory optimization, not a stylistic preference.
var stackBuf: array[16, byte]
stackBuf[0] = 1
echo "stack array uses ", sizeof(stackBuf), " bytes inline; heap seq len = ", taken.len

echo "done — every destruction above happened at a known point in the program"
