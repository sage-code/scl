// 04 — Control flow — run with: swift 04_control_flow.swift
//
// Swift's control flow is designed around two ideas: the compiler must be able
// to prove that every path is handled (switch is exhaustive), and the happy
// path should not be buried inside nested ifs (guard).

import Foundation

// 1. An if/else that yields a value is an expression (Swift 5.9+), so it can be
//    assigned instead of stated twice.
let temperature = 31
let advice = if temperature > 30 { "stay in the shade" } else { "walk outside" }
print(advice)

// 2. guard is the early-exit tool: it unwraps, validates and returns in one
//    line, leaving the rest of the function at the top indentation level.
func greet(_ name: String?) -> String {
    guard let name, !name.isEmpty else { return "Hello, stranger" }
    return "Hello, \(name)"
}
print(greet(nil), "|", greet("Ada"))

// 3. switch must be exhaustive and never falls through — no break needed, and
//    forgetting a case is a compile error rather than a silent bug.
func describe(_ value: Int) -> String {
    switch value {
    case 0:               return "zero"
    case 1...9:           return "single digit"
    case let n where n < 0: return "negative"
    default:              return "large"
    }
}
print(describe(0), describe(7), describe(-3), describe(500))

// 4. Patterns can destructure tuples and bind the parts you still need.
for point in [(0, 0), (1, 0), (3, 4)] {
    switch point {
    case (0, 0):          print("origin")
    case (let x, 0):      print("on the x-axis at \(x)")
    case let (x, y):      print("x = \(x), y = \(y)")
    }
}

// 5. for-in walks any Sequence; stride() expresses a step that is not 1.
for step in stride(from: 0, to: 10, by: 3) { print(step, terminator: " ") }
print()

// 6. while checks before, repeat checks after — the body always runs once.
var countdown = 3
while countdown > 0 { countdown -= 1 }
repeat {
    countdown += 1
} while countdown < 2
print("countdown = \(countdown)")

// 7. Labeled loops let break and continue name the loop they belong to, which
//    is how you leave two nested loops without a flag variable.
outer: for row in 1...3 {
    for column in 1...3 {
        if row * column > 4 { continue outer }
        print("\(row)x\(column)=\(row * column)", terminator: " ")
    }
}
print()

// 8. Where clauses filter inside the loop header — no nested if required.
for value in 1...10 where value.isMultiple(of: 3) { print(value, terminator: " ") }
print()
