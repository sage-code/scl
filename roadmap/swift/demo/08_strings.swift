// 08 — Strings and text — run with: swift 08_strings.swift
//
// A Swift String is a collection of extended grapheme clusters, not of bytes
// and not of UTF-16 units. That is why counting is accurate, why indices are
// not integers, and why indexing costs a walk rather than an array lookup.

import Foundation

// 1. Strings are value types: every transformation returns a new string and
//    leaves the original untouched.
var name = "swift"
let upper = name.uppercased()
print(name, upper)                     // swift SWIFT

// 2. Interpolation plus explicit format control for numbers and widths.
let ratio = 2.0 / 3.0
print("ratio = \(String(format: "%.3f", ratio))")
print("padded = \(String(format: "%5.2f", ratio))")

// 3. Characters versus bytes: an emoji or a flag is one character but many
//    bytes. Never assume count == utf8.count when slicing network payloads.
let flag = "🇸🇪"
print(flag.count, flag.utf8.count, flag.unicodeScalars.count)

// 4. Indices are strings' own types, and you move them rather than adding to
//    them, so a slice always lands on a cluster boundary.
let sentence = "hello world"
if let space = sentence.firstIndex(of: " ") {
    print(sentence[sentence.startIndex..<space])          // hello
    print(sentence[sentence.index(after: space)...])      // world
}

// 5. Splitting keeps the empty fields when you ask it to — important for CSV,
//    where an empty column is data and not noise.
let csv = "swift,rust,go,,zig"
let fields = csv.split(separator: ",", omittingEmptySubsequences: false)
print(fields.map(String.init))
print(fields.joined(separator: " | "))

// 6. Searching, replacing and trimming.
print(sentence.contains("world"), sentence.replacingOccurrences(of: "world", with: "swift"))
print("  padded  ".trimmingCharacters(in: .whitespaces))

// 7. Multi-line literals keep the newlines and drop the indentation; the
//    closing delimiter decides how much indentation counts.
let report = """
    name:  \(name)
    upper: \(upper)
    """
print(report)

// 8. Comparison is Unicode-aware: two strings written with different bytes but
//    the same visible characters are equal.
print("café" == "cafe\u{301}")         // true — same graphemes, different bytes
print("Z" < "a")                       // true — scalars, not locale collation
