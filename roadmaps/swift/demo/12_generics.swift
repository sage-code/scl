// 12 — Generics — run with: swift 12_generics.swift
//
// A generic function or type is written once against a placeholder type, and
// the compiler produces the specialised version for you. That is a compile-time
// operation, so a generic array is exactly as fast as a hand-written one — and
// the constraints you write are guarantees the body can rely on.

import Foundation

// 1. One implementation, any element type. T is fixed per call, not per value.
func first<T>(_ items: [T]) -> T? { items.first }
print(first([1, 2, 3]) ?? 0, first(["a", "b"]) ?? "none")

// 2. Generic types compose: Pair<A, B> holds two unrelated types together.
struct Pair<A, B> {
    let first: A
    let second: B
}
print(Pair(first: "count", second: 3).first)

// 3. A constraint states what the body needs. `T: Numeric` is what makes the
//    literal 0 and the + operator legal inside the function.
func sum<T: Numeric>(_ values: [T]) -> T { values.reduce(0, +) }
print(sum([1, 2, 3]), sum([1.5, 2.25]))

// 4. A where clause expresses requirements that depend on an associated type,
//    which the angle brackets alone cannot name.
func allEqual<C: Collection>(_ items: C) -> Bool where C.Element: Equatable {
    guard let firstItem = items.first else { return true }
    return items.allSatisfy { $0 == firstItem }
}
print(allEqual([1, 1, 1]), allEqual(["a", "b"]), allEqual([Int]()))

// 5. Generic algorithms over your own protocols: index any identifiable type.
protocol Entity { var id: String { get } }
func indexById<Item: Entity>(_ items: [Item]) -> [String: Item] {
    Dictionary(uniqueKeysWithValues: items.map { ($0.id, $0) })
}
struct User: Entity { let id: String }
print(indexById([User(id: "u1"), User(id: "u2")]).keys.sorted())

// 6. Generic extensions add capability to a whole family of collection types.
extension Collection {
    var isNotEmpty: Bool { !isEmpty }
}
print([1].isNotEmpty, [Int]().isNotEmpty)

// 7. Overloads resolve before generics: the compiler prefers the more specific
//    declaration, so a generic default never blocks a hand-tuned version.
func describe<T>(_ value: T) -> String { "generic \(type(of: value))" }
func describe(_ value: Int) -> String { "integer \(value)" }
print(describe(7), "|", describe("seven"))

// 8. Where generics stop: they cannot replace a protocol with dynamic
//    behaviour. When the set of types is open at runtime, use `any Protocol`.
