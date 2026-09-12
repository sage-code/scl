// 13 — Closures — run with: swift 13_closures.swift
//
// A closure is a function that captures the context where it was written. The
// syntax is the easy part; the part that matters is what happens to the
// variables it captures, because that is where lifetime bugs live.

import Foundation

// 1. The full form: parameters, return type, then `in` and the body.
let double = { (value: Int) -> Int in value * 2 }
print(double(21))

// 2. In a context that already knows the type, everything redundant can go —
//    $0 is the first argument.
let triple: (Int) -> Int = { $0 * 3 }
print(triple(7))

// 3. Trailing closure syntax moves the last closure outside the parentheses,
//    which is why Swift APIs read like control statements.
func repeatTask(times: Int, task: (Int) -> Void) {
    for time in 1...times { task(time) }
}
repeatTask(times: 3) { time in
    print("tick \(time)", terminator: " ")
}
print()

// 4. Closures capture variables by reference, not by value: the closure sees
//    the live variable, including changes made after it was created.
var counter = 0
let increment = { counter += 1 }
increment()
increment()
print("counter = \(counter)")           // 2

// 5. A capture list snapshots the value at creation time, which breaks that
//    link and is the standard fix for "the closure sees a different number".
let snapshot: () -> Int = { [counter] in counter }
counter = 100
print("snapshot = \(snapshot()), counter = \(counter)")   // 2 100

// 6. Closures that outlive the call are escaping; the alternative — a closure
//    returned from a function — is the same idea with the compiler's blessing.
let stored: [() -> String] = [{ "first" }, { "second" }]
print(stored.map { $0() })

func makeAdder(_ amount: Int) -> (Int) -> Int { { $0 + amount } }
let add10 = makeAdder(10)
print(add10(5), add10(90))

// 7. Higher-order functions are just closures in a well-known position, and a
//    sort comparator is the classic example.
let words = ["swift", "go", "rust", "c"]
print(words.sorted { $0.count < $1.count })
print(words.filter { $0.count > 2 }.map { $0.uppercased() })

// 8. A named function can be used anywhere a closure is expected.
func add(_ a: Int, _ b: Int) -> Int { a + b }
let reference = add
print(reference(2, 3), [1, 2, 3].reduce(0, add))
