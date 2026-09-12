// 17 — Access control and modules — run with: swift 17_access_control.swift
//
// Access control decides who may see a declaration. In a single file you only
// observe `private` and `fileprivate` directly, because one file is one module
// for a script — but the levels are what turn a folder of files into a library
// with a deliberate public surface.

import Foundation

// The five levels, from the most open to the most closed:
//   open        public and overridable/subclassable from another module (classes only)
//   public      visible from another module, but not overridable there
//   internal    the default: visible anywhere inside the same module
//   fileprivate visible inside this file only
//   private     visible inside the declaration that introduces it (and its
//               extensions in the same file)

// 1. A public type needs an explicit public initialiser, otherwise the init
//    stays internal and other modules cannot create the type at all.
public struct BankAccount {
    public private(set) var balance: Int      // read anywhere, write only here
    private var auditLog: [String] = []       // fully hidden implementation

    public init(opening: Int) { balance = opening }

    public mutating func deposit(_ amount: Int) {
        balance += amount
        auditLog.append("deposit \(amount)")
    }

    // fileprivate: the extension below can use it, no other file can.
    fileprivate var logCount: Int { auditLog.count }

    // internal by default: visible to the whole module, not to importers.
    func log() -> String { auditLog.joined(separator: ", ") }
}

var account = BankAccount(opening: 10)
account.deposit(5)
print(account.balance, account.log(), account.logCount)
// account.balance = 999        // error: cannot assign to a `private(set)` property

// 2. A type declared inside a function is private to that function body — the
//    narrowest useful scope, and the reason helper types stop leaking.
func parseSettings(_ text: String) -> [String: String] {
    struct Setting { let key: String; let value: String }
    var map: [String: String] = [:]
    for chunk in text.split(separator: ";") {
        let parts = chunk.split(separator: "=")
        guard parts.count == 2 else { continue }   // skips "broken"
        let setting = Setting(key: String(parts[0]), value: String(parts[1]))
        map[setting.key] = setting.value
    }
    return map
}
print(parseSettings("theme=dark;font=mono;broken").sorted { $0.key < $1.key })

// 3. A caseless enum is the idiomatic namespace: it cannot be instantiated and
//    groups constants and helpers without polluting the global scope. In a real
//    package this declaration would simply be `public`.
enum Version {
    static let current = "5.9"
    static func isSupported(_ value: String) -> Bool {
        let major = value.split(separator: ".").first.flatMap { Int($0) } ?? 0
        return major >= 5
    }
}
print(Version.current, Version.isSupported("5.9"), Version.isSupported("4.2"))

// 4. Modules are the unit the compiler builds. A single file is one module, so
//    `internal` here behaves like `public` would in a package: the boundary only
//    becomes visible when a second file or a second target is added.
print("module boundary: one file, one module")
