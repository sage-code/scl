# 08_strings.nim — strings, characters and formatting.
#
# Run it with:  nim c -r 08_strings.nim
#
# A Nim `string` is a mutable byte buffer with a length prefix: it is not
# NUL-terminated, it can contain embedded zeroes, and indexing gives a `char`.
# Text handling is therefore explicit — use `strutils` for scanning, `unicode`
# for code-point aware work, and `strformat` for building messages.

import std/[strutils, strformat, unicode, sequtils]

let plain = "line one\nline two"          # escape sequences are the same as C
echo "length=", plain.len, " bytes"

# Triple-quoted strings keep newlines literally and need no escapes — ideal for
# embedded text and SQL. `&"""` makes it a raw string: backslashes stay put.
let banner = """
Usage: demo [options]
  --verbose   explain what happens
"""
let raw = r"C:\nim\bin\nim.exe"
echo banner.strip()
echo "raw path: ", raw, " (no escape processing)"

# `strformat`'s `fmt` macro understands format specifiers and expressions. It is
# expanded at compile time, so a typo in the variable name is a compile error.
let name = "Grace"
let score = 93.4567
echo fmt"{name:<10}|{score:>8.2f}|{score.int} points"
echo &"interpolation works too: {name} scored {score:.1f}"

# `strutils` covers the everyday work: trimming, case, searching, splitting.
let csv = "  alpha, beta ,gamma  "
let fields = csv.strip().split(',')
for i, f in fields:
  echo "field ", i, " = '", f.strip(), "'"
echo "join: ", fields.mapIt(it.strip().capitalizeAscii()).join(" | ")

let sentence = "Nim compiles to C, C++ or JavaScript"
echo "contains 'C++'? ", "C++" in sentence
echo "starts with 'Nim'? ", sentence.startsWith("Nim")
echo "upper: ", sentence.toUpperAscii()
echo "replaced: ", sentence.replace("JavaScript", "JS")
echo "findAll 'C': ", sentence.findAll('C')

# Splitting a line into typed values is a parser, and parsers must handle bad
# input. `parseInt` returns the number of characters consumed — zero means the
# text was not a number, so you decide the policy instead of the library.
for text in ["42", "3.14", "abc"]:
  var value: int
  let used = parseInt(text, value)
  if used == text.len:
    echo "parsed int ", value
  else:
    var f: float
    let fUsed = parseFloat(text, f)
    echo (if fUsed == text.len: "parsed float " & $f else: "not numeric: " & text)

# `unicode` counts code points rather than bytes: important for truncation and
# for user-visible lengths. "é" is two bytes in UTF-8 but one rune.
let accented = "café ☕"
echo "bytes=", accented.len, " runes=", accented.runeLen
echo "first rune: ", accented.runeAt(3)

# Build strings efficiently: `add` appends in place, `&` allocates a new one.
var report = ""
for i in 1 .. 3:
  report.add("item " & $i & "; ")
echo report.strip(leading = false, trailing = true, chars = {' '})
