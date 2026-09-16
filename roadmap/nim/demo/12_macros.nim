# 12_macros.nim — templates and macros: metaprogramming with real ASTs.
#
# Run it with:  nim c -r 12_macros.nim
#
# Templates replace text before type checking; macros run *inside* the compiler
# over an abstract syntax tree. Both are compile-time only — nothing ships
# except the expanded code, so using a template costs no more than writing the
# code out by hand. Two rules keep metaprogramming sane:
#   - reach for a template first; a macro only when you must inspect or build
#     AST nodes.
#   - templates are hygienic: symbols you declare inside do not leak.

import std/[strutils, times]
import std/macros

# 1. A template that introduces a new operator. `~=` is expanded at every call
#    site, so `a ~= b` compiles to exactly the comparison you wrote.
template `~=`(a, b: float): bool =
  abs(a - b) < 1e-9

# 2. A statement template: the `untyped` body parameter is substituted twice.
#    Be careful — the body runs twice, including any side effects.
template twice(body: untyped) =
  body
  body

# 3. Guarding a body with a label and a timer. `body` is a statement list, and
#    `untyped` means "anything the caller writes"; the template decides where it
#    lands. This is the everyday use of templates: boilerplate you refuse to
#    repeat.
template timed(label: string; body: untyped) =
  block:
    let start = epochTime()
    body
    echo "  ", label, " took ", formatFloat(epochTime() - start, ffDecimal, 6), "s"

# 4. A macro that inspects its arguments. `varargs[untyped]` captures the raw
#    expressions; `repr` renders each one back to source text, so the same macro
#    prints `x = 41` without the caller writing the name twice.
macro debugVars(args: varargs[untyped]): untyped =
  result = newStmtList()
  for arg in args:
    result.add newCall(bindSym"echo", newLit(arg.repr & " = "), arg)
    # `bindSym` resolves `echo` in the macro's own scope: the caller cannot
    # shadow it and break this expansion.

# 5. A macro that builds new syntax with `quote do` and injects caller code with
#    backticks. `quote` keeps hygiene; backticks are the deliberate escape.
macro withValues(a, b: untyped; body: untyped): untyped =
  result = quote do:
    let x = `a`
    let y = `b`
    `body`

# 6. Static (compile-time) work: `static:` blocks run in the compiler's VM.
static:
  const built = "length of " & $(2 + 3)
  echo "compile-time echo: ", built       # appears during compilation only

const
  Filled = "abc".repeat(3)                # const evaluation also uses the VM

let a = 1.0 / 3.0
let b = 0.333333333333
echo "1/3 ~= 0.333333333333 ? ", a ~= b

twice:
  stdout.write "twice: hi! "
stdout.write "\n"

timed "loop of 200_000 additions":
  var acc = 0
  for i in 0 .. 200_000:
    acc += i
  echo "  acc = ", acc

let x = 41
let name = "nim"
debugVars(2 + 2, name.toUpperAscii(), x + 1)

withValues(10 * 2, 5 * 3):
  echo "x=", x, " y=", y, " product=", x * y

echo "filled = ", Filled
echo "generated at compile time; runtime saw only the expansion"
