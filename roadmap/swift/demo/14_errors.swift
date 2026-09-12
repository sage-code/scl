// 14 — Error handling — run with: swift 14_errors.swift
//
// Swift has no exceptions: a function that can fail says so in its signature,
// and the caller must acknowledge it with try. The error itself is an ordinary
// value, usually an enum, which means you can switch on it like any other data.

import Foundation

// 1. Errors are types that conform to Error. An enum is the natural fit because
//    the set of possible failures is closed and known.
enum NetworkError: Error {
    case offline
    case badStatus(Int)
}

// 2. Conforming to CustomStringConvertible controls what the user sees.
extension NetworkError: CustomStringConvertible {
    var description: String {
        switch self {
        case .offline:                return "offline"
        case .badStatus(let code):    return "status \(code)"
        }
    }
}

// 3. `throws` in the signature is a contract with the caller, checked at
//    compile time. Nothing is thrown implicitly.
func fetch(_ path: String) throws -> String {
    guard !path.isEmpty else { throw NetworkError.offline }
    if path.contains("500") { throw NetworkError.badStatus(500) }
    return "body of \(path)"
}

// 4. do/catch handles failures; catch clauses are matched in order, so put the
//    specific patterns before the general one.
func run(_ path: String) {
    do {
        print("ok:", try fetch(path))
    } catch NetworkError.offline {
        print("offline — retry later")
    } catch NetworkError.badStatus(let code) where code >= 500 {
        print("server error \(code)")
    } catch {
        print("unexpected: \(error)")
    }
}
run("/users")
run("")
run("/500")

// 5. try? discards the error and returns an optional — fine for a fallback,
//    wrong when the reason for the failure matters.
print((try? fetch("")) ?? "no body")

// 6. defer schedules cleanup for every exit path, including a throw.
func withResource(_ body: () -> Void) {
    print("acquire")
    defer { print("release") }
    body()
}
withResource { print("work") }

// 7. Result moves the outcome into a value, which is what you want when the
//    caller is a callback that cannot throw.
func load(_ path: String) -> Result<String, NetworkError> {
    do {
        return .success(try fetch(path))
    } catch let error as NetworkError {
        return .failure(error)
    } catch {
        return .failure(.offline)
    }
}
switch load("") {
case .success(let body):   print(body)
case .failure(let error):  print("failed:", error)
}
print(load("/500"))

// 8. `rethrows` is how collection methods stay non-throwing for non-throwing
//    closures: map only throws if your closure does.
let numbers = ["1", "2", "x"]
print(numbers.compactMap { Int($0) })
