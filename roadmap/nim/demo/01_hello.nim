# 01_hello.nim — the smallest complete Nim program.
#
# Run it with:  nim c -r 01_hello.nim
#   `nim c` compiles to a native executable, `-r` runs it after a clean compile.
#
# Why start here? A Nim program is read top to bottom: every statement in the
# file body becomes the body of `main`. There is no `main` function to declare
# and no header to include — the `system` module is imported implicitly.

# `echo` is a template from `system`. It writes its arguments to stdout,
# separated by a single space, then appends a newline.
echo "Hello, World!"

# Strings use double quotes. `&` concatenates strings and `$` converts any
# value to its string form. You rarely need printf-style formatting.
let language = "Nim"
echo "Hello from " & language & "!"

# `&"..."` is string interpolation: each `{expr}` is evaluated and passed
# through `$`. It is a template, so it costs nothing at runtime.
echo &"Compiled by Nim {NimVersion} for {hostOS} ({hostCPU})."

# Import at top level, anywhere in the file. `std/` names the standard library
# package, which avoids collisions with your own modules.
import std/strutils

# `stdout.write` is the lower-level call behind `echo`: no separator, no
# newline. Use it when you need exact control over the output bytes.
stdout.write "decorated: "
stdout.write "nim".toUpperAscii.repeat(3)
stdout.write "\n"

# Comments: `#` runs to end of line; `#[ ... ]#` is a block comment that
# nests. A `##` comment is a *documentation* comment — `nim doc` harvests it.
#[ Block comments let you disable code while keeping inner `#` comments:
   echo "this line is disabled"
]#
echo "done"
