// 15 — Memory, ARC and reference cycles — run with: swift 15_memory_arc.swift
//
// Swift has no garbage collector that scans memory while the program runs.
// Instead the compiler inserts retain and release calls around every reference,
// and the object is destroyed when the count hits zero. Watch the deinit lines
// in this output — they are the reference count becoming visible.

import Foundation

// 1. A class instance is born at init and dies at deinit. Nothing else has a
//    destructor hook in Swift, which is why cleanup belongs there.
final class Session {
    let id: Int
    init(id: Int) {
        self.id = id
        print("+ session \(id) created")
    }
    deinit { print("- session \(id) deallocated") }
}

var local: Session? = Session(id: 1)     // count 1
var strong = local                        // count 2
strong = Session(id: 2)                   // count back to 1; session 1 lives on
local = nil                              // count 0 -> deinit runs

// 2. The classic leak: two objects that reference each other. Both counts stay
//    at 1 forever, so neither deinit ever runs — the memory is lost silently.
final class TreeNode {
    var child: TreeNode?
    deinit { print("- tree node deallocated") }
}
var nodeA: TreeNode? = TreeNode()
var nodeB: TreeNode? = TreeNode()
nodeA?.child = nodeB
nodeB?.child = nodeA                     // cycle
nodeA = nil
nodeB = nil                              // nothing is printed: the cycle leaks

// 3. weak breaks the cycle. It does not retain, and it becomes nil
//    automatically when the object it points at disappears.
final class Owner {
    var pet: Pet?
    deinit { print("- owner deallocated") }
}
final class Pet {
    weak var owner: Owner?               // weak must be optional and var
    deinit { print("- pet deallocated") }
}
var owner: Owner? = Owner()
var pet: Pet? = Pet()
owner?.pet = pet
pet?.owner = owner
owner = nil
pet = nil                                // both deallocate: no cycle

// 4. unowned is the other half of the pair: it does not retain either, but it
//    is not optional, so it is only safe when the referenced object outlives it.
final class Customer {
    var card: Card?
    deinit { print("- customer deallocated") }
}
final class Card {
    unowned let customer: Customer       // the card cannot outlive its holder
    init(customer: Customer) { self.customer = customer }
    deinit { print("- card deallocated") }
}
var customer: Customer? = Customer()
customer?.card = Card(customer: customer!)
customer = nil                           // card and customer deallocate together
print("reference kinds explained")

// 5. Closures capture strongly by default, and a closure stored on the object
//    that owns it creates the same kind of cycle as step 2.
final class Ticker {
    var ticks = 0
    lazy var onTick: () -> Void = {
        self.ticks += 1                  // strong self, held by self
    }
    deinit { print("- ticker deallocated") }
}
var ticker: Ticker? = Ticker()
ticker?.onTick()
print("ticker ticks =", ticker?.ticks ?? 0)
ticker = nil                             // deinit does not run — the leak is real

// 6. [weak self] inside the capture list fixes it, and the optional chaining
//    handles the case where the object is already gone when the closure runs.
final class SafeTicker {
    var ticks = 0
    lazy var onTick: () -> Void = { [weak self] in
        self?.ticks += 1
    }
    deinit { print("- safe ticker deallocated") }
}
var safeTicker: SafeTicker? = SafeTicker()
safeTicker?.onTick()
print("safe ticks =", safeTicker?.ticks ?? 0)
safeTicker = nil                         // deinit runs now

// 7. Value types copy, and copy-on-write makes the copy cheap: storage is
//    shared until one of the two is mutated.
var original = Array(repeating: 0, count: 1000)
var duplicate = original                 // no copy yet, storage is shared
duplicate[0] = 1                         // one copy happens here, once
print(original[0], duplicate[0])
