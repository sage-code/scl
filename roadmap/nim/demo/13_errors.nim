# 13_errors.nim — raising, catching, cleanup and the raise contract.
#
# Run it with:  nim c -r 13_errors.nim
#
# Exceptions are the Nim default for unrecoverable conditions; `Option` and
# result-style returns are the alternative for expected failures. What matters
# here is the *ordering* discipline: the compiler tracks which exceptions a proc
# may raise (`.raises: [...]`), and `except` clauses are checked top-down, so a
# broad catch placed first makes the specific ones unreachable.

import std/[strutils, options]

# A custom exception is any `object of CatchableError`. `Defect` descendants
# indicate bugs (index out of range, nil dereference) and are NOT meant to be
# caught in normal flow — catching them hides defects.
type
  ValidationError = object of CatchableError
    field: string            # exceptions are objects: carry structured payload

proc validateAge(raw: string): int =
  ## Parse and range-check an age, raising ValidationError with context.
  let value = parseInt(raw)
  if value < 0 or value > 130:
    raise newException(ValidationError,
      "age out of range: " & raw)
  value

proc register(raw: string): int =
  ## `.raises` is a static contract: callers are told what may escape, and the
  ## compiler verifies that the body cannot raise anything else unlisted.
  {.raises: [ValidationError, ValueError].}
  result = validateAge(raw)

# Expected failure is often better as a value than as an exception: an `Option`
# forces the caller to decide what to do, with no control-flow surprise.
proc parseAgeSafe(raw: string): Option[int] =
  try:
    some(parseInt(raw))
  except ValueError:
    none(int)

# `except` clauses are matched in order; `as e` binds the exception object.
for input in ["42", "999", "abc"]:
  try:
    let age = register(input)
    echo "registered ", input, " -> ", age
  except ValidationError as e:
    echo "validation failed for '", e.field, "': ", e.msg
  except ValueError:
    echo "'", input, "' is not a number — caught before it reached register"
  except CatchableError as e:
    echo "unexpected: ", e.name, ": ", e.msg

# `finally` runs whether the block succeeded, raised or returned. `defer` is the
# scoped variant: it runs when the enclosing block exits, including on early
# `return`, which is how Nim does RAII-style cleanup without a destructor type.
proc readConfig(): string =
  echo "  open config handle"
  defer: echo "  close config handle (even if we return early)"
  for line in ["host=local", "port=8080"]:
    if line.startsWith("port"):
      return line                # `defer` still runs on the way out
  "default"

echo "config: ", readConfig()

# `try/except/finally` in one statement, and how to re-raise with context.
proc divide(a, b: int): int =
  try:
    if b == 0:
      raise newException(ValueError, "division by zero")
    result = a div b
  except ValueError:
    echo "  divide(): logging and re-raising"
    raise                        # bare `raise` preserves the original traceback
  finally:
    echo "  divide() finished"

try:
  echo "10 / 2 = ", divide(10, 2)
  echo "10 / 0 = ", divide(10, 0)
except ValueError as e:
  echo "caught at top level: ", e.msg

# The Option path: no exception in sight for a bad value.
for raw in ["7", "oops"]:
  let parsed = parseAgeSafe(raw)
  if parsed.isSome:
    echo "safe parse ok: ", parsed.get
  else:
    echo "safe parse rejected: ", raw
