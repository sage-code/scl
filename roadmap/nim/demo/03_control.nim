# 03_control.nim — selection and iteration.
#
# Run it with:  nim c -r 03_control.nim
#
# In Nim almost everything is an *expression*: `if`, `case` and `block` all
# produce values. That means you assign the result of a decision directly,
# instead of declaring a variable and filling it inside every branch.

import std/strutils

# `if / elif / else` used as an expression. Both branches must produce the
# same type, and the compiler guarantees the assignment always happens.
let temperature = 21
let advice = if temperature > 25: "hot" elif temperature > 15: "pleasant" else: "cold"
echo "advice: ", advice

# A statement form is also available when you only need effects.
if temperature < 0:
  echo "freezing"
elif temperature < 10:
  echo "chilly"
else:
  echo "fine"

# `case` works on ordinals (int, enum, char, bool) and strings, must be
# exhaustive, and can use ranges and sets of values. Exhaustiveness is checked
# at compile time — a forgotten enum member is a compile error, not a bug.
proc describe(day: range[1 .. 7]): string =
  case day
  of 1, 7: "weekend"
  of 2 .. 6: "workday"
  else: "unreachable, but the compiler needs no else here: `range[1..7]` is covered"
echo describe(6), " / ", describe(7)

# `when` is compile-time selection. Both branches are parsed, only one is
# compiled, so it can guard code that would not compile on other targets.
when defined(windows):
  echo "target: Windows"
elif defined(linux):
  echo "target: Linux"
else:
  echo "target: " & hostOS

# `for` iterates with the `..` range operator: inclusive, and optimized to a
# plain counter. `countdown` walks downward; `..<` stops before the end.
var total = 0
for i in 1 .. 5: total += i
echo "1..5 sum = ", total

for i in countdown(3, 1): stdout.write i, " "
stdout.write "\n"

for i in 0 ..< 3:
  if i == 1: continue          # skip the rest of this iteration
  stdout.write "i", i, " "
stdout.write "\n"

# `while` is the unbounded loop. `break` leaves the nearest loop; a labelled
# `block` gives an escape hatch that is cleaner than a boolean flag.
var n = 27
var steps = 0
while n != 1:
  n = if n mod 2 == 0: n div 2 else: 3 * n + 1
  steps += 1
echo "collatz steps for 27 = ", steps

block search:
  for row in 0 .. 9:
    for col in 0 .. 9:
      if row * col == 42:
        echo "first product 42 at ", row, "x", col
        break search            # leaves both loops, not just the inner one
echo "control flow finished"
