# 05_objects.nim — objects, reference objects and dynamic dispatch.
#
# Run it with:  nim c -r 05_objects.nim
#
# Nim separates *value* objects from *reference* objects:
#   object        — allocated inline, copied by assignment, no identity
#   ref object    — heap allocated, shared, garbage-collected, has identity
# Inheritance exists only for `ref object of RootObj`. Prefer value objects and
# composition; reach for the ref hierarchy when you truly need runtime
# polymorphism.

import std/strutils

# A value object: cheap to create, copied on assignment, no allocation.
type
  Point = object
    x, y: int

# Operators are ordinary procs with symbolic names.
func `+`(a, b: Point): Point = Point(x: a.x + b.x, y: a.y + b.y)
func `$`(p: Point): string = "(" & $p.x & ", " & $p.y & ")"

# A reference hierarchy. `of RootObj` opts the type into inheritance.
type
  Animal = ref object of RootObj
    name: string
  Cat = ref object of Animal
    lives: int            # a field that only cats have
  Dog = ref object of Animal
    tricks: seq[string]

# `method` is dispatched on the runtime type of the first argument, so the call
# below picks the most specific version at run time. `proc` would bind at
# compile time and always run the `Animal` version for a base-typed variable.
method speak(a: Animal): string = a.name & " makes an indeterminate sound"
method speak(c: Cat): string = c.name & " says meow, " & $c.lives & " lives left"
method speak(d: Dog): string = d.name & " says woof, " & $d.tricks.len & " tricks"

# `func` cannot have side effects — a compile-time guarantee, useful for
# formatters and comparisons. It works for hierarchies too: mark it `method`.
func `$`(a: Animal): string = a.name
func isNamed(a: Animal; wanted: string): bool = a.name == wanted

# Constructors are plain procs. Naming them `newX` is only a convention; the
# real requirement is that callers get a fully initialized object.
proc newCat(name: string; lives = 9): Cat = Cat(name: name, lives: lives)
proc newDog(name: string; tricks: seq[string]): Dog = Dog(name: name, tricks: tricks)

let origin = Point(x: 1, y: 2)
let shifted = origin + Point(x: 10, y: 20)     # `origin` is untouched: a copy
echo "origin=", origin, " shifted=", shifted

# A heterogeneous collection: the base type holds every subtype reference.
let pets: seq[Animal] = @[
  newCat("Pixel"),
  newCat("Momo", lives = 7),
  newDog("Rex", @["sit", "roll over"]),
]

for pet in pets:
  echo speak(pet)                              # dynamic dispatch happens here
  if pet of Cat:                               # `of` tests the runtime type
    echo "  -> a cat with " & $Cat(pet).lives & " lives"   # safe downcast
  echo "  -> named Pixel? ", isNamed(pet, "Pixel")

# Structural equality: with the default `==`, two refs compare identity. The
# generic `==` for objects compares field by field.
echo "two equal points: ", origin == Point(x: 1, y: 2)
echo "same cat object:  ", pets[0] == pets[0]
