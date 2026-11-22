// 07 — Optionals — run with: swift 07_optionals.swift
//
// An optional is not a null pointer with syntax sugar: it is `enum Optional`
// with the cases .none and .some(value). Because the compiler can see both
// cases, forgetting to handle "no value" is a compile-time problem, not a
// runtime crash.

import Foundation

// 1. The type says out loud that a value may be absent.
var middleName: String? = "Quinn"
print(middleName ?? "none")

// 2. if let binds only when the optional holds a value. Since Swift 5.7 the
//    binding can reuse the same name, so there is no second variable to track.
if let middleName { print("bound: \(middleName)") }

// 3. guard is the tool for the top of a function: unwrap or leave.
func initials(_ full: String?) -> String {
    guard let full, !full.isEmpty else { return "?" }
    return full.split(separator: " ").compactMap(\.first).map(String.init).joined()
}
print(initials("Ada Lovelace"), initials(nil), initials(""))

// 4. Optional chaining walks a path and stops silently at the first nil — no
//    nested ifs, and the whole expression is still an optional.
struct Address { var city: String }
struct Person { var address: Address? }
let person = Person(address: nil)
print(person.address?.city ?? "unknown")
let other = Person(address: Address(city: "Cluj"))
print(other.address?.city.uppercased() ?? "unknown")

// 5. map transforms the wrapped value without unwrapping it; because the result
//    could be nil, the type becomes Int? — which is what map does, not flatMap.
let text: String? = "42"
let parsed: Int? = text.map { Int($0) ?? 0 }
print(parsed ?? -1)
let nested: String?? = "deep"
print(nested.flatMap { $0 } ?? "empty")   // flatMap collapses one level

// 6. Force unwrapping is a promise you cannot keep forever. Compare the two
//    lines: one needs a fallback, the other needs the value to really be there.
let safe = Int("99")
print(safe ?? 0)
// let crash = Int("ninety-nine")!   // fatal error: unexpectedly found nil

// 7. Optional is an enum, so it can be switched on like any other enum.
func describe(_ value: Int?) -> String {
    switch value {
    case .none:            return "missing"
    case .some(let number): return "value \(number)"
    }
}
print(describe(nil), "|", describe(7))

// 8. In Swift 5.9, `if let` and `switch` on an optional can be combined with
//    shorthand; and `??` can short-circuit into another optional chain.
let firstLetter: String? = nil
print(firstLetter ?? other.address?.city ?? "none")
