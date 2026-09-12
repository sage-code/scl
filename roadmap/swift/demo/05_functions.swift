// 05 — Functions — run with: swift 05_functions.swift
//
// A Swift function is a value with an argument-label grammar. Labels are part
// of the API: the call site reads like a sentence, which is why the standard
// library has `array.insert(x, at: 0)` rather than `array.insert(x, 0)`.

import Foundation

// 1. The first parameter has one name; later parameters have an external label
//    and an internal name, separated by a space.
func move(from start: Int, to end: Int) -> Int { end - start }
print(move(from: 1, to: 10))

// 2. An underscore drops the label when the meaning is obvious from the type.
func square(_ value: Int) -> Int { value * value }
print(square(9))

// 3. A default value makes the parameter optional at the call site.
func greet(_ name: String, greeting: String = "Hello") -> String {
    "\(greeting), \(name)"
}
print(greet("Ada"), "|", greet("Ada", greeting: "Hi"))

// 4. A variadic parameter collects the remaining arguments into an array.
func average(_ numbers: Double...) -> Double {
    guard !numbers.isEmpty else { return 0 }
    return numbers.reduce(0, +) / Double(numbers.count)
}
print(average(1, 2, 3, 4))

// 5. inout passes the caller's variable itself, so the function writes back
//    into it. The & at the call site is the visible permission slip.
func doubleInPlace(_ value: inout Int) { value *= 2 }
var amount = 21
doubleInPlace(&amount)
print("amount = \(amount)")

// 6. Several results travel as one tuple, named so callers can read them.
func divide(_ a: Int, by b: Int) -> (quotient: Int, remainder: Int) {
    (a / b, a % b)
}
let result = divide(17, by: 5)
print(result.quotient, result.remainder)

// 7. Functions are values: store them, pass them, return them.
func multiply(_ a: Int, _ b: Int) -> Int { a * b }
let operation: (Int, Int) -> Int = multiply
print(operation(6, 7))
func choose(byName name: String) -> (Int, Int) -> Int { name == "add" ? (+) : multiply }
print(choose(byName: "add")(4, 5), choose(byName: "mul")(4, 5))

// 8. @discardableResult acknowledges that ignoring the result is intentional,
//    so callers do not have to write `_ = ` every time.
@discardableResult
func log(_ message: String) -> Int { message.count }
log("not needed by the caller")
print("logged")

// 9. Output parameters are no longer written as inout+return: returning a tuple
//    is idiomatic Swift, and the compiler optimises the copy away.

// 10. Functions declared inside functions capture their context, which is the
//     building block of the closures demo (13).
func makeCounter() -> () -> Int {
    var count = 0
    func next() -> Int { count += 1; return count }
    return next
}
let counter = makeCounter()
print(counter(), counter(), counter())
