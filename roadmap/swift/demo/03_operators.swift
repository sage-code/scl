// 03 — Operators and expressions — run with: swift 03_operators.swift
//
// Swift keeps the familiar C-family operator set but removes the sharp edges:
// no implicit truthiness, no silent overflow, and two distinct operators for
// "same value" and "same object".

import Foundation

// 1. Arithmetic. Integer division truncates toward zero; mixing Int and Double
//    is a compile error, so the division below is written with two Doubles.
print(7 / 2, 7 % 2, 7.0 / 2.0)

// 2. Remainder keeps the sign of the left operand, unlike a mathematical mod.
print(-7 % 3, 7 % -3)

// 3. Comparison and Boolean logic short-circuit: the right side is skipped when
//    the left side already decides the answer.
let age = 30
print(age >= 18 && age < 65, age < 18 || age >= 65)

// 4. Range operators build values, not loops. `...` includes the upper bound,
//    `..<` stops before it — the classic off-by-one bug, made visible.
let closed = 1...5
let halfOpen = 1..<5
print(Array(closed), Array(halfOpen), (0..<10).contains(9))

// 5. Nil-coalescing: use the left operand unless it is nil.
let input: String? = nil
print(input ?? "default")

// 6. The ternary operator earns its place for one condition. Nesting it is a
//    sign you want a switch or a lookup table instead.
let score = 72
print(score >= 50 ? "pass" : "fail")

// 7. Compound assignment exists; the C-style ++ and -- do not.
var total = 0
total += 5
total *= 2
print("total = \(total)")

// 8. For classes, `==` compares values and `===` compares identity. Two
//    objects can be equal in content and still be different objects.
final class Node { let id: Int; init(id: Int) { self.id = id } }
let first = Node(id: 1)
let second = Node(id: 1)
let alias = first
print(first === second, first === alias)   // false true

// 9. The pattern-match operator ~= is what switch uses under the hood, and it
//    is read as "does this value fall inside this pattern?".
print(closed ~= 3, closed ~= 9)

// 10. Bitwise operators are useful for flags and packed data.
let readOnly = 0b100
let hidden = 0b010
print(readOnly | hidden, readOnly & hidden, readOnly ^ hidden, ~readOnly)
