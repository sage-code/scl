# 02_variables.nim — values, variables and the type system.
#
# Run it with:  nim c -r 02_variables.nim
#
# Nim has three declaration forms and they mean different things:
#   let   — a runtime value that cannot be reassigned (the default choice)
#   var   — a mutable location
#   const — a compile-time value, inlined and usable in type definitions
# Prefer `let`: mutation is the exception, not the norm.

import std/strutils

# Types are inferred from the initializer. `let` with no initializer is
# impossible — the compiler refuses, which removes a class of bugs.
let greeting = "hello"        # string
let answer = 42               # int  (the native register width)
let ratio = 1.5               # float64, always double precision
let ready = true              # bool
let letter = 'N'              # char, a single 8-bit character

# Explicit types are written after a colon. Use them when the inferred type is
# too wide: integer literals default to `int`, not to a narrow type.
let small: uint8 = 200
let precise: float32 = 0.1'f32

# `var` is mutable. Reassignment must keep the same type: Nim is statically
# typed, with no implicit conversions between numeric types.
var counter = 0
counter += 1                  # same as counter = counter + 1
counter.inc(4)                # procs can take a `var` parameter and mutate it

# `const` must be computable at compile time; it can be used where a type or
# array size is expected.
const MaxItems = 8
const Banner = "items: "
let items: array[MaxItems, int] = [1, 2, 3, 4, 5, 6, 7, 8]

# Integer literals accept `_`, and bases are explicit. `'i64`/`'u32`/... are
# type suffixes that force the exact width the program needs.
let big = 9_000_000'i64
let flags = 0b1010_1010'u8
let perms = 0o755
let mask = 0xFF_FF

# No implicit numeric conversion: to change width or signedness, be explicit.
# `int(...)` checks the value at runtime and raises RangeDefect on overflow,
# which is why casts and conversions are deliberately different operations.
let widened = float64(counter) + ratio
let narrowed = int(precise * 10.0)

echo Banner, "counter=", counter, " widened=", widened.formatFloat(ffDecimal, 2),
     " narrowed=", narrowed
echo "answer=", answer, " ready=", ready, " letter=", letter, " small=", small
echo "big=", big, " flags=", flags, " perms=", perms, " mask=", mask

# `echo` prints natural-size integers; `$` is the general "to string" operator.
# Loop instead of calling a helper when you want the accumulation visible.
var itemTotal = 0
for item in items:
  itemTotal += item
echo Banner, "sum = ", itemTotal
echo "hello".toUpperAscii & " / " & greeting
