# 17_testing.nim — unit tests with std/unittest.
#
# Run it with:  nim c -r 17_testing.nim     (or: nim r 17_testing.nim)
# The test runner is compiled into the binary, so a "test suite" is a normal
# executable. `nimble test` calls exactly this command, which is why a project
# needs no extra framework to be testable.
#
# The three assertions you will use most:
#   check  cond          — verifies, records a failure, and *continues*
#   expect E: stmt       — the statement must raise exception type E
#   require cond         — like check, but aborts the whole test run
#
# `doAssert` is different: it is a plain assertion outside the reporting
# framework, it aborts on failure, and it survives `-d:release` (whereas
# `assert` is compiled out).

import std/[unittest, strutils]

# ---------------------------------------------------------------------------
# Code under test. Keep it free of test-only branches: if the test needs to
# reach inside, that is a design signal, not a testing problem.
type
  StackError = object of CatchableError

  IntStack = object
    data: seq[int]

proc push(s: var IntStack; value: int) =
  s.data.add(value)

proc pop(s: var IntStack): int =
  if s.data.len == 0:
    raise newException(StackError, "pop from an empty stack")
  result = s.data[^1]
  s.data.setLen(s.data.len - 1)

proc size(s: IntStack): int = s.data.len

proc normalizeName(raw: string): string =
  ## Trim, collapse inner whitespace and ASCII-uppercase the first letter.
  raw.strip().splitWhitespace().join(" ").capitalizeAscii()

# ---------------------------------------------------------------------------
# A suite groups related tests; a test has one reason to exist. The name is the
# failure message, so write it as a claim: "pop returns the last pushed value".
suite "IntStack":
  test "a new stack is empty":
    let s = IntStack()
    check s.size == 0

  test "push increases the size and pop returns the last pushed value":
    var s = IntStack()
    s.push(1)
    s.push(2)
    check s.size == 2                 # continues to the next check on failure
    check s.pop() == 2
    check s.pop() == 1
    check s.size == 0

  test "pop on an empty stack raises StackError":
    var s = IntStack()
    expect StackError:
      discard s.pop()                 # the raise is the expected behaviour

  test "push and pop do not disturb sibling stacks":
    var a, b: IntStack
    a.push(10)
    b.push(20)
    check a.pop() == 10
    check b.pop() == 20

suite "normalizeName":
  test "trims the outside and collapses the inside":
    check normalizeName("  ada   lovelace \t ") == "Ada lovelace"

  test "leaves an already-clean name unchanged":
    check normalizeName("Grace Hopper") == "Grace Hopper"

  test "an empty string stays empty":
    check normalizeName("") == ""

# Tests may be written anywhere in the file — even interleaved with the code
# they cover, which keeps the expectation next to the implementation.
suite "edge cases":
  test "a single pop returns the only element":
    var s = IntStack()
    s.push(7)
    check s.pop() == 7
    expect StackError:
      discard s.pop()

# `require` stops the run when a precondition fails — use it for setup, not for
# expectations, or you will hide the tests that would have passed.
suite "preconditions":
  test "a failing require aborts this run":
    var s = IntStack()
    s.push(1)
    require s.size == 1
    check s.pop() == 1

# Outside the framework: `doAssert` is compiled in release builds, `assert` is
# not. Use `doAssert` for invariants a shipping binary must never violate, and
# plain `assert` for expensive checks you only want during development.
doAssert normalizeName(" x ") == "X", "doAssert still runs under -d:release"
echo "all suites executed"
