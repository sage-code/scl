# 06_variants.nim — enums, sets and variant (tagged-union) objects.
#
# Run it with:  nim c -r 06_variants.nim
#
# These three types share one property: they model "one of a fixed set of
# alternatives". Nim checks the alternatives exhaustively at compile time, so
# you cannot forget a branch of an `enum` and you cannot read a field of a
# variant that the current tag does not own.

import std/strutils

# An enum is an ordered, compile-time-known set of names. Values are ordinals:
# `ord` gives the position, `succ`/`pred` move through it.
type
  Color = enum
    cRed, cGreen, cBlue
  # `{.pure.}` keeps the members out of the global namespace and forces the
  # qualified form `Color.cRed` — worth it in larger projects.

echo "ord(cGreen)=", ord(cGreen), " succ=", succ(cGreen), " pred=", pred(cBlue)

# Sets are bitsets over ordinals. Membership tests, unions and intersections
# are single machine operations, which makes sets the natural way to express
# permission flags and small option groups.
type
  Permission = enum
    pRead, pWrite, pExecute

let allowed: set[Permission] = {pRead, pWrite}
let denied = {pExecute}
echo "read allowed?  ", pRead in allowed
echo "union:          ", allowed + denied
echo "intersection:   ", allowed * {pWrite, pExecute}
echo "difference:     ", allowed - {pWrite}

# A variant object carries a discriminator field plus fields that belong to
# specific cases. It is the safe alternative to a "generic record with half the
# fields unused" and to unchecked C unions.
type
  Shape = object
    label: string
    case kind: ShapeKind      # the discriminator; must be an enum or ordinal
    of skCircle:
      radius: float
    of skRect:
      width, height: float
    of skPoint:
      discard                 # no payload at all for this case

  ShapeKind = enum
    skCircle, skRect, skPoint

# Because `case` on an enum must be exhaustive, adding a new ShapeKind makes
# every proc below fail to compile until it is handled. That is the point.
func area(s: Shape): float =
  case s.kind
  of skCircle: PI * s.radius * s.radius
  of skRect: s.width * s.height
  of skPoint: 0.0

func describe(s: Shape): string =
  case s.kind
  of skCircle: "circle r=" & s.radius.formatFloat(ffDecimal, 1)
  of skRect: "rect " & $s.width & "x" & $s.height
  of skPoint: "point"

let shapes = [
  Shape(label: "wheel", kind: skCircle, radius: 2.0),
  Shape(label: "door", kind: skRect, width: 3.0, height: 1.5),
  Shape(label: "origin", kind: skPoint),
]

for s in shapes:
  echo s.label.alignLeft(7), " ", describe(s).alignLeft(14),
       " area=", area(s).formatFloat(ffDecimal, 2)

# `$` for an enum is generated automatically; `parseEnum` reads one back.
echo "parsed: ", parseEnum[Color]("cBlue")
