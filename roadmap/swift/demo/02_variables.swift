// 02 — Variables and types — run with: swift 02_variables.swift
//
// Swift is statically typed: every value has exactly one type, known before the
// program runs. You rarely write the type yourself because the compiler infers
// it from the initial value — but the type is always there, and it never changes.

import Foundation

// 1. Inference versus annotation. `42` is an Int; the annotated version takes
//    the same literal and converts it, because the annotation is the authority.
let inferred = 42
let annotated: Double = 42
print(type(of: inferred), type(of: annotated))   // Int Double

// 2. Integers have a fixed width and a visible limit. Each width is a separate
//    type, so a UInt8 and an Int never mix without a conversion.
let small: UInt8 = 200
print("small = \(small), UInt8.max = \(UInt8.max), Int.max = \(Int.max)")

// Overflow traps by default — a crash in debug, which is what you want while
// learning. The &+ operator asks for wrap-around arithmetic instead.
print("255 &+ 1 = \(UInt8.max &+ 1)")
// let tooBig: UInt8 = 200 + 100   // compile-time error: not representable

// 3. Floating point is binary, not decimal, so some decimals are approximate.
print("0.1 + 0.2 = \(0.1 + 0.2)")                          // 0.30000000000000004
print("rounded  = \(String(format: "%.2f", 0.1 + 0.2))")  // 0.30

// 4. Booleans are a type, never an integer.
let isCompiled = true
print(isCompiled ? "compiled" : "interpreted")

// 5. Tuples group several values without declaring a type. Labels make the
//    access readable; a tuple is not a substitute for a struct with behaviour.
let point = (x: 3, y: 4)
let (x, y) = point                      // destructuring in one line
print(point.x, point.y, Double(x * x + y * y).squareRoot())

// 6. Type aliases document intent without inventing a new type.
typealias Celsius = Double
let boiling: Celsius = 100.0
print("water boils at \(boiling)°C")

// 7. Optional is a type: `String?` is a String that may also be "no value".
//    It is not null — it is an enum with two cases, which is why the compiler
//    forces you to handle the missing case.
var nickname: String? = nil
print(nickname as Any)                  // nil
nickname = "Ada"
print(nickname ?? "none")               // Ada
