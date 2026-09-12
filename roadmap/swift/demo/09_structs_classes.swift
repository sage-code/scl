// 09 — Structs, classes and inheritance — run with: swift 09_structs_classes.swift
//
// Swift gives you two ways to build an object, and the choice is the single
// most important design decision in the language: a struct is a value that gets
// copied, a class is a reference that gets shared.

import Foundation

// 1. A struct is a value: assignment copies, so each variable owns its data.
struct Point { var x: Int; var y: Int }
var p1 = Point(x: 1, y: 2)
var p2 = p1
p2.x = 99
print(p1.x, p2.x)                       // 1 99 — independent

// 2. A method that mutates a struct must say so, and computed properties give
//    derived values a name. Extensions add both to a type you do not own.
extension Point {
    mutating func move(byX dx: Int, y dy: Int) { x += dx; y += dy }
    var description: String { "(\(x), \(y))" }
}
p1.move(byX: 3, y: 4)
print(p1.description)

// 3. A class is a reference: both names point at the same object.
final class Counter { var value = 0 }
let c1 = Counter()
let c2 = c1
c2.value = 7
print(c1.value, c2.value)               // 7 7 — one object, two names

// 4. Inheritance, overriding and super. A subclass initialiser sets its own
//    stored properties first, then the compiler calls super.init().
class Shape {
    var name: String { "shape" }
    func area() -> Double { 0 }
    func describe() -> String { "\(name) with area \(area())" }
}
class Circle: Shape {
    let radius: Double
    init(radius: Double) { self.radius = radius }
    override var name: String { "circle" }
    override func area() -> Double { .pi * radius * radius }
}
class Square: Shape {
    let side: Double
    init(side: Double) { self.side = side }
    override var name: String { "square" }
    override func area() -> Double { side * side }
}

// 5. Dynamic dispatch through the base class is what makes a heterogeneous
//    array useful — the same call reaches a different implementation.
let shapes: [Shape] = [Circle(radius: 2), Square(side: 3)]
for shape in shapes { print(shape.describe()) }

// 6. Property observers run after a store; lazy postpones work until the first
//    read. Both are ways to keep a type honest about its own state.
struct Order {
    var items: [String] = [] {
        didSet { print("items changed: \(items.count)") }
    }
    lazy var summary: String = "order of \(items.count) item(s)"
}
var order = Order()
order.items.append("book")
order.items.append("pen")
print(order.summary)

// 7. Prefer structs until you need identity shared between two owners. A class
//    earns its keep for shared mutable state, inheritance, or deinit work.
struct Temperature { var celsius: Double }
let readings = [Temperature(celsius: 20), Temperature(celsius: 22)]
print(readings.map(\.celsius).reduce(0, +) / Double(readings.count))
