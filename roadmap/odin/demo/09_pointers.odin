// 09_pointers.odin — addresses, dereferencing, and why a pointer is not scary.
//
// Run it with:
//     odin run 09_pointers.odin -file
//
// What it shows:
//   * `&value` takes an address; `pointer^` reads the value at that address.
//   * Before the dereference you have an address; after it you have the value.
//   * A pointer can be nil, and comparing with nil is how you ask whether it
//     points anywhere at all.
//   * Procedures that take `^T` can change the caller's value — that is the
//     whole reason pointers appear in signatures.
//
// A pointer is a number with a type attached. Nothing here is magic, and
// nothing happens unless you write it.

package main

import "core:fmt"

Counter :: struct {
	value: int,
	label: string,
}

// Taking `^Counter` means "the caller hands over the address of its counter,
// so changes here are visible there". Without the caret, this would edit a
// copy and the caller would never know.
bump :: proc(c: ^Counter, by: int) {
	// `c^.field` is the whole syntax: dereference, then pick a field. The
	// parentheses-free form is idiomatic Odin, and this line is worth reading
	// slowly until it feels ordinary.
	c.value += by

	// The same thing spelled with explicit parentheses, for comparison:
	(c^).label = "bumped"
}

main :: proc() {
	// --- An address and the value at it ---
	answer := 42
	p := &answer			// p has type ^int: the address of answer

	fmt.println("the value :", answer)		// 42
	fmt.println("the address:", p)			// some address, e.g. 0xc0000b4008
	fmt.println("through it :", p^)			// 42 — dereference: read the value

	// Writing through the pointer writes through to the variable. There is no
	// copy anywhere in these two lines.
	p^ = 43
	fmt.println("answer after writing through p:", answer)		// 43

	// --- Pointers to structs ---
	counter := Counter{value: 10, label: "start"}
	cp := &counter

	// Field access through a pointer does not need an explicit dereference:
	// the compiler knows cp points at a Counter, so `cp.value` means the same
	// as `cp^.value`.
	fmt.println("counter.value :", counter.value)	// 10
	fmt.println("cp.value      :", cp.value)		// 10 — same field
	fmt.println("cp^.value     :", cp^.value)		// 10 — the explicit form

	// Because the procedure takes an address, the change really happens.
	bump(cp, 5)
	fmt.println("after bump:", counter.value, counter.label)	// 15 bumped

	// --- nil: "this points at nothing" ---
	// A pointer declared without a target is nil, not garbage. Comparing with
	// nil before dereferencing is the guard that keeps a program alive.
	var nothing: ^Counter
	fmt.println("is nil:", nothing == nil)			// true

	if nothing == nil {
		fmt.println("refusing to dereference a nil pointer")
	}

	// --- Pointers and values coexist ---
	// The struct itself was never moved; only its address was passed around.
	// That is why a struct can stay exactly where it is and still be edited by
	// a procedure three calls away.
	local := Counter{value: 1, label: "local"}
	bump(&local, 100)			// &local — the address of a local variable
	fmt.println("local after bump:", local.value)

	// --- Where the address actually lives ---
	// size_of answers a question about the type, and it is the same size for
	// every pointer on a given machine: an address is one word.
	fmt.println("size_of(^int)    :", size_of(^int))		// 4 or 8
	fmt.println("size_of(^Counter):", size_of(^Counter))	// the same number
}
