// 06 — Collections — run with: swift 06_collections.swift
//
// Array, Dictionary and Set are value types with copy-on-write storage. That
// combination is why assigning a large array is instant (both names share the
// buffer) while the first mutation costs one copy.

import Foundation

// 1. Array: ordered, indexed, and the default collection in Swift.
var languages = ["Swift", "Rust", "Go"]
languages.append("Zig")
languages.removeAll { $0 == "Go" }        // predicate-based removal
print(languages, languages.count, languages.first ?? "none")

// 2. Dictionary: keyed lookup, unordered. Reading a key returns an optional,
//    because a missing key is a normal outcome rather than an error.
var ratings: [String: Int] = ["Swift": 5, "Rust": 4]
ratings["Go"] = 3
if let swift = ratings["Swift"] { print("Swift rated \(swift)") }
for (key, value) in ratings.sorted(by: { $0.key < $1.key }) {
    print("\(key): \(value)")
}
print("unknown key ->", ratings["Cobol"] ?? -1)

// 3. Set: uniqueness is the point, and membership is O(1) instead of O(n).
let tags: Set<String> = ["swift", "ios", "swift"]
print(tags.count, tags.contains("ios"))
let evens: Set<Int> = [2, 4, 6]
let threes: Set<Int> = [3, 6, 9]
print(evens.intersection(threes).sorted(), evens.union(threes).sorted())

// 4. map / filter / reduce replace hand-written accumulator loops and say what
//    they do instead of how they do it.
let numbers = [1, 2, 3, 4, 5, 6]
let evenSquares = numbers.filter { $0.isMultiple(of: 2) }.map { $0 * $0 }
print(evenSquares, numbers.reduce(0, +))

// 5. Key paths give map a shorter spelling when you only read a property.
let names = ["ada", "grace", "alan"]
print(names.map(\.count).sorted())

// 6. Value semantics: the copy below is independent, so the two arrays drift
//    apart. Compare with the class version in demo 09 to feel the difference.
struct Score { var points: Int }
var board = [Score(points: 1)]
var copy = board
copy[0].points = 99
print(board[0].points, copy[0].points)   // 1 99

// 7. Tuples inside arrays sort by field order, which is enough for many report
//    style tasks without defining a Comparable type.
let sales = [("book", 12), ("pen", 40), ("lamp", 3)]
print(sales.sorted { $0.1 > $1.1 }.map(\.0))
