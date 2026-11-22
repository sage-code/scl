# 09_generics.nim — generic procs and types with checked constraints.
#
# Run it with:  nim c -r 09_generics.nim
#
# Generics in Nim are monomorphized: the compiler instantiates a concrete copy
# per type it is used with, so there is no boxing and no virtual call. Type
# classes (`SomeNumber`, `SomeFloat`) constrain what may be instantiated, and
# `when T is ...` lets one generic body behave differently per type — all
# resolved before a single line of machine code exists.

import std/strutils

# 1. A generic proc. `T` is a placeholder the compiler infers from the call.
proc first[T](values: openArray[T]): T = values[0]

# 2. A constrained generic: `T: SomeNumber` accepts int and float kinds only,
#    and rejects strings with a clear compile-time message.
proc clamp[T: SomeNumber](value, lo, hi: T): T =
  if value < lo: lo
  elif value > hi: hi
  else: value

# 3. `when T is ...` specializes the body per type class. Only the matching
#    branch survives; the others are discarded during instantiation.
proc kindOf[T](x: T): string =
  when T is SomeFloat: "float"
  elif T is SomeInteger: "integer"
  elif T is string: "string"
  elif T is bool: "bool"
  else: "other"

# 4. A generic type. `Box[T]` stores any payload; `$` is generic over it too.
type
  Box[T] = object
    value: T

proc `$`[T](b: Box[T]): string = "Box(" & $b.value & ")"
proc map[T, U](b: Box[T]; f: proc(x: T): U): Box[U] = Box[U](value: f(b.value))

# 5. Compile-time parameters. `static[int]` is an argument evaluated at compile
#    time, so it can size an array — impossible with a normal runtime argument.
proc filled[T](value: T; times: static[int]): array[times, T] =
  for i in 0 ..< times:
    result[i] = value

# 6. `typedesc` accepts a type as an argument: `defaultValue(int)`.
proc defaultValue[T](t: typedesc[T]): T = default(T)

# 7. Generic iterator over pairs of two sequences; the element types differ.
iterator zipped[A, B](a: openArray[A]; b: openArray[B]): (A, B) =
  for i in 0 ..< min(a.len, b.len):
    yield (a[i], b[i])

echo "first ints:   ", first([10, 20, 30])
echo "first names:  ", first(["ada", "grace"])
echo "clamped int:  ", clamp(12, 1, 10)
echo "clamped f64:  ", clamp(2.5, 0.0, 1.0)
echo "kindOf:       ", kindOf(1.5), " ", kindOf(1), " ", kindOf("x"), " ", kindOf(true)

# The call site decides T; being explicit is optional but sometimes clarifying.
echo "explicit:     ", clamp[int](99, 0, 5)

let boxed = Box[seq[string]](value: @["a", "b"])
echo "boxed:        ", boxed
echo "mapped:       ", boxed.map(proc(s: seq[string]): int = s.len)

echo "static-sized: ", filled(7, 4)
echo "default:      ", defaultValue(float32)
echo "default str:  '", defaultValue(string), "'"

for a, b in zipped([1, 2, 3], ["one", "two", "three"]):
  echo "  ", a, " => ", b
