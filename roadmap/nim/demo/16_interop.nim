# 16_interop.nim — calling C, exporting to C, and dynamic libraries.
#
# Run it with:  nim c -r 16_interop.nim
#
# Nim compiles to C, so the boundary is thin: declare the C function's signature,
# name the header with `header:`, and call it. Four pragmas cover almost every
# case:
#   importc       — the symbol exists in a library (with `header:` or `dynlib:`)
#   exportc       — this Nim proc is callable from C under the given name
#   cdecl         — use the C calling convention (required for callbacks)
#   varargs / bycopy / noSideEffect — fine-tuning for the boundary
#
# Rules of engagement: never let a C callback touch Nim garbage-collected data
# unless the thread holds a Nim GC context, and treat every incoming pointer as
# untrusted (length-check it yourself).

import std/[strutils, math]

# 1. A libc function declared inline. `cstring` is Nim's pointer-to-char,
#    `csize_t` maps to C's size_t; `$` converts a cstring back to a Nim string.
proc cStrlen(s: cstring): csize_t {.importc: "strlen", header: "<string.h>".}

echo "strlen('hello from Nim') = ", cStrlen("hello from Nim")

# 2. `sleep` lives in different headers per platform, so guard the declaration.
#    The guard is compile-time: the symbol is only emitted for the matching OS.
when not defined(windows):
  proc cSleep(seconds: cuint) {.importc: "sleep", header: "<unistd.h>".}

when defined(windows):
  proc cSleep(seconds: cuint) {.importc: "Sleep", header: "<windows.h>".}
  # Windows sleeps in milliseconds, which is exactly the sort of mismatch that
  # makes a wrapper proc (rather than a raw `importc`) the safer design.

proc pauseSeconds(seconds: int) =
  ## Hide the platform difference behind one Nim proc.
  when defined(windows):
    cSleep(cuint(seconds * 1000))
  else:
    cSleep(cuint(seconds))

echo "sleeping is available: ", declared(pauseSeconds)
echo "no actual sleep in this demo — it would slow the example down"

# 3. Calling into C's math library through the header. `{.importc.}` binds the
#    C signature, while the Nim-side types keep working normally.
proc cHypot(x, y: cdouble): cdouble {.importc: "hypot", header: "<math.h>".}
echo "hypot(3, 4) = ", cHypot(3.0, 4.0)

# 4. Exporting Nim code to C. `exportc` fixes the linker symbol, `cdecl` fixes
#    the calling convention. The proc must not raise an exception across the
#    boundary — a Nim exception escaping into C is undefined behaviour, so
#    convert failures into return codes.
proc nimAdd(a, b: cint): cint {.exportc: "nim_add", cdecl.} =
  a + b

proc nimSafeDivide(a, b: cint; outValue: ptr cint): cint {.exportc: "nim_safe_div", cdecl.} =
  if b == 0:
    return -1                      # C convention: negative code means failure
  outValue[] = a div b
  0

var quotient: cint
echo "nim_add(2, 3) = ", nimAdd(2, 3)
echo "nim_safe_div(9, 3) = ", nimSafeDivide(9, 3, addr quotient), " -> ", quotient
echo "nim_safe_div(9, 0) = ", nimSafeDivide(9, 0, addr quotient), " (error code)"

# 5. A C callback type: `{.cdecl.}` is part of the type, so any Nim proc passed
#    in must match exactly. `qsort` is the canonical example.
type
  CmpFn = proc(a, b: pointer): cint {.cdecl.}

proc qsort(base: pointer; count, size: csize_t; cmp: CmpFn) {.
    importc: "qsort", header: "<stdlib.h>".}

proc cmpInts(a, b: pointer): cint {.cdecl.} =
  let x = cast[ptr cint](a)[]
  let y = cast[ptr cint](b)[]
  cint(x - y)                      # negative / zero / positive, as C expects

var numbers: array[5, cint] = [42, 7, 19, 3, 88]
qsort(addr numbers[0], csize_t(numbers.len), csize_t(sizeof(cint)), cmpInts)
echo "sorted in C: ", numbers

# 6. Dynamic loading: `dynlib` defers to run time, so the binary links without
#    Tcl installed. The version pattern tries each alternative in order, which
#    is how library sonames vary across distributions.
when defined(linux):
  proc tclVersion(major, minor, patchLevel: ptr cint;
                  releaseType: ptr cint) {.
      importc: "Tcl_GetVersion", dynlib: "libtcl(|8.5|8.6).so".}
  discard declared(tclVersion)
  echo "dynlib declaration compiled — it is only resolved when called"

# 7. Layout matters at the boundary: `sizeof` and `offsetOf` let you assert the
#    ABI assumptions your C counterparts make.
type CHeader = object
  magic: uint32
  version: uint16
  flags: uint16

echo "sizeof(CHeader) = ", sizeof(CHeader), ", flags offset = ", offsetOf(CHeader, flags)
doAssert sizeof(CHeader) == 8, "the C side expects a packed 8-byte header"
