# 19_buildmodes.nim — compilation modes, checks and build flags.
#
# Run it several times and compare the output:
#   nim c -r 19_buildmodes.nim                 # debug (default build)
#   nim c -r -d:release 19_buildmodes.nim      # optimized, traces kept
#   nim c -r -d:danger 19_buildmodes.nim       # optimized, every check off
#
# What each knob actually does:
#   (default)  --stackTrace:on --lineTrace:on --opt:none, all runtime checks on
#   -d:release --opt:speed, traces off, checks ON, assertions compiled OUT
#   -d:danger  implies release AND turns off range/overflow/bound checks and
#              assertion reporting — a single out-of-range index is undefined
#              behaviour, so keep it for benchmarks and trusted hot paths
#   --panics:on  turns runtime check failures into panics (abort, no traceback)
#                instead of raising; off by default, useful for embedded targets
#   --mm:orc (default) / --mm:arc / --mm:refc (deprecated in favor of ARC/ORC)
#   --app:console|gui|lib|staticLib — `--app:lib` builds a .so/.dll; a C host
#                then calls NimMain() once before any exported proc

import std/[strutils]

# 1. `static:` blocks run in the compiler's virtual machine. This is how you
#    assert build preconditions before a single line of the program exists.
static:
  echo "compiling for ", hostOS, "/", hostCPU, " with Nim ", NimVersion
  doAssert NimMajor >= 2,
    "this demo targets Nim 2.x; upgrade the toolchain (or adjust the guards)"
  # `hostOS`/`hostCPU`/`NimVersion` are system constants, available at compile
  # time and at run time — no duplication between build script and program.

# 2. A compile-time `when` selects the value of a constant. Nothing is decided
#    at run time here: the compiler keeps one branch and discards the other.
const BuildMode =
  when defined(danger): "danger"
  elif defined(release): "release"
  elif defined(debug): "debug (explicit -d:debug)"
  else: "debug (default)"

echo "build mode : ", BuildMode
echo "os / cpu   : ", hostOS, " / ", hostCPU
echo "compiler   : ", NimVersion

# 3. `compileOption` reports the *effective* flags, which is far more reliable
#    than asking "was -d:release passed?". A project may set them in a
#    config.nims, a nimble task or a CI script.
echo "checks on? : ", compileOption("checks")
echo "boundCheck : ", compileOption("boundChecks")
echo "rangeCheck : ", compileOption("rangeChecks")
echo "overflowChk: ", compileOption("overflowChecks")
echo "assertions : ", compileOption("assertions")   # compiled out by -d:release

# 4. Selective disabling. `push`/`pop` bracket a region where a check is off, so
#    a hot path can skip bounds checking without weakening the whole module.
#    This is the disciplined alternative to `-d:danger`.
{.push boundChecks: off.}
proc uncheckedSum(a: openArray[int]): int =
  ## Callers now own the index contract: an out-of-range index here is memory
  ## corruption, not an exception. Keep such procs tiny and well documented.
  var i = 0
  while i < a.len:
    result += a[i]
    inc i
{.pop.}

let values = [1, 2, 3, 4]
echo "sum        : ", uncheckedSum(values), " (checks restored after push/pop)"

# 5. `when` guards code that would not even compile elsewhere. Cross-compilation
#    (`--os:linux --cpu:arm`) or freestanding targets therefore need no source
#    changes — only these branches.
when defined(js):
  echo "running in a browser via the JavaScript backend"
elif defined(standalone):
  echo "freestanding build: no OS, use --mm:arc and avoid std/os"
elif defined(windows):
  echo "native Windows build; link flags come from --passL if needed"
else:
  echo "native POSIX build; --passC/--passL forward flags to the C compiler"

# 6. Version and platform guards let one source tree serve several compilers.
when NimMajor >= 2 and NimMinor >= 2:
  echo "Nim 2.2+ features are available in this build"
else:
  echo "older Nim 2.x: keep to the compatible subset"

# 7. Assertions: `assert` vanishes under -d:release, `doAssert` never does. Both
#    come with a message that is only paid for when the check can fail.
assert values.len == 4, "development-time check"
doAssert unsafeAddr(values[0]) != nil, "invariant that must hold in production"

# 8. Deployment consequence: the same source produces measurably different
#    binaries. Compare them yourself with:
#      nim c -d:release --outdir:build 19_buildmodes.nim
#      nim c -d:danger  --outdir:build 19_buildmodes.nim
#      ls -l build/
echo "recompile with -d:release / -d:danger and compare the sections above"
