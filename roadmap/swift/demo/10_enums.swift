// 10 — Enumerations — run with: swift 10_enums.swift
//
// A Swift enum is a full type, not an integer constant: it can carry data per
// case, expose methods, be generic, and be recursive. Used well, it removes
// whole categories of invalid state from a program.

import Foundation

// 1. A plain enum is a closed set, and CaseIterable lets you walk it.
enum Direction: CaseIterable {
    case north, south, east, west
}
print(Direction.allCases.count)
for direction in Direction.allCases where direction == .north { print("first:", direction) }

// 2. Raw values convert between the case and a primitive, in both directions.
//    The conversion returns an optional because the number may not exist.
enum Status: Int { case draft, review, published }
print(Status.review.rawValue, Status(rawValue: 2) ?? .draft)

enum Endpoint: String { case users, orders }
print(Endpoint.users.rawValue, Endpoint(rawValue: "orders") ?? .users)

// 3. Associated values attach data to a case, so the payload travels with the
//    decision instead of living beside it in separate variables.
enum Outcome {
    case success(String)
    case failure(code: Int, message: String)
}
func handle(_ outcome: Outcome) {
    switch outcome {
    case .success(let body):
        print("ok:", body)
    case .failure(let code, let message) where code >= 500:
        print("server error \(code): \(message)")
    case .failure(_, let message):
        print("client error:", message)
    }
}
handle(.success("ready"))
handle(.failure(code: 503, message: "down"))
handle(.failure(code: 404, message: "missing"))

// 4. Enums have methods, computed properties and failable initialisers, which
//    is what turns a set of cases into a small domain model.
enum Signal: Int {
    case red = 1, green = 2
    var isStop: Bool { self == .red }
    init?(sensor: String) {
        switch sensor {
        case "stop": self = .red
        case "go":   self = .green
        default:     return nil
        }
    }
}
print(Signal(sensor: "go")?.isStop ?? true, Signal(sensor: "?") as Any)

// 5. Recursive enums describe trees; `indirect` boxes the case that recurses.
indirect enum Expr {
    case number(Int)
    case add(Expr, Expr)
}
func evaluate(_ expr: Expr) -> Int {
    switch expr {
    case .number(let value):    return value
    case .add(let left, let right): return evaluate(left) + evaluate(right)
    }
}
print(evaluate(.add(.number(2), .add(.number(3), .number(4)))))

// 6. Optional is itself an enum, and so is Result — the pattern you just read
//    is the same pattern the standard library uses for error handling.
print(Outcome.success("done"))
