// 11 — Protocols and protocol-oriented design — run with: swift 11_protocols.swift
//
// A protocol is a contract: it lists what a type must be able to do, and says
// nothing about how. Swift then lets you supply default behaviour for a whole
// family of conformers with a protocol extension, which is the mechanism behind
// most of the standard library.

import Foundation

// 1. The smallest useful protocol: one requirement, one conformer.
protocol Describable { var summary: String { get } }

struct Book: Describable {
    let title: String
    var summary: String { "Book: \(title)" }
}
print(Book(title: "Swift").summary)

// 2. A protocol extension gives a default implementation for free — no base
//    class, no inheritance chain, no duplicated code in each conformer.
protocol Greeter { var name: String { get } }
extension Greeter {
    func greet() -> String { "Hello, \(name)" }
    func greet(loud: Bool) -> String { loud ? greet().uppercased() : greet() }
}
struct Robot: Greeter { let name: String }
print(Robot(name: "R2").greet(), "|", Robot(name: "R2").greet(loud: true))

// 3. Protocol composition requires several contracts at once. Writing
//    `some P & Q` also keeps the concrete type opaque to the caller.
protocol Named { var name: String { get } }
protocol Aged { var age: Int { get } }
func introduce(_ person: some Named & Aged) -> String {
    "\(person.name), age \(person.age)"
}
struct Student: Named, Aged { let name: String; let age: Int }
print(introduce(Student(name: "Ada", age: 20)))

// 4. Opaque return types hide the concrete type but promise it never changes,
//    which is what lets the optimiser keep static dispatch.
func makeGreeter() -> some Greeter { Robot(name: "C-3PO") }
print(makeGreeter().greet())

// 5. Associated types make a protocol generic over the element type it works
//    with, without naming a concrete type in the protocol itself.
protocol Stack {
    associatedtype Element
    mutating func push(_ element: Element)
    mutating func pop() -> Element?
}
struct ArrayStack<Element>: Stack {
    private var items: [Element] = []
    mutating func push(_ element: Element) { items.append(element) }
    mutating func pop() -> Element? { items.popLast() }
}
var stack = ArrayStack<Int>()
stack.push(1)
stack.push(2)
print(stack.pop() ?? 0, stack.pop() ?? 0)

// 6. Existentials (`any P`) store different conformers in one array; you lose
//    static dispatch, but you gain the ability to mix behaviours at runtime.
let library: [any Describable] = [Book(title: "Swift"), Book(title: "Rust")]
print(library.map(\.summary).joined(separator: ", "))

// 7. Conditional conformance extends a generic type only where it makes sense,
//    so `[Int]` gains a capability that `[Any]` never had.
extension Array: Describable where Element: CustomStringConvertible {
    var summary: String { "Array of \(count)" }
}
print([1, 2, 3].summary)
