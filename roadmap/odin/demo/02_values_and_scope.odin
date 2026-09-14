// 02_values_and_scope.odin — declarations, mutability, constants and defer.
//
// Run it with:
//     odin run 02_values_and_scope.odin -file
//
// What it shows:
//   * `:=` declares and infers the type; `=` only assigns to something that
//     already exists — and only if it was declared `mut`.
//   * Constants are compile-time values; they are not variables that happen
//     to be read-only.
//   * A `{ }` block is a scope: names declared inside it are gone at its end.
//   * `defer` runs a statement when the enclosing scope exits, on every path.
//
// The last point is the one to watch closely: it is the habit that replaces
// manual cleanup in every Odin program you will write.

package main

import "core:fmt"

// A constant belongs to the package and carries no storage at run time. The
// value must be knowable at compile time.
LIMIT :: 3
GREETING :: "hello"

main :: proc() {
	// := declares AND initialises, with the type taken from the value.
	counter := 0					// int
	label := "start"				// string
	ratio := 0.5					// f64, because the literal has a fraction

	// counter and label are mutable; ratio is too. Mutability is the default
	// for a variable introduced with :=. Only constants refuse assignment.
	counter += 1
	label = "running"

	fmt.println(label, counter, ratio)

	// A declared-but-unset variable gets the zero value of its type. That is a
	// real value, not garbage: 0, "", false, nil.
	var unset: int
	var empty: string
	fmt.println(unset, empty)		// 0  (an empty string prints as nothing)

	// Explicit types are written when inference would guess wrong, or when you
	// want the reader to see the width on purpose.
	var small: u8 = 250
	fmt.println(small)

	// A block is a scope. `inner` exists only between these braces, and the
	// outer `counter` is still reachable from inside — that is how shadowing
	// accidents start, so name inner variables distinctly.
	{
		inner := counter * 10
		fmt.println("inside the block:", inner)
	}
	// fmt.println(inner)			// would not compile: inner is out of scope

	// Constants are usable anywhere and cannot be reassigned. Trying
	// LIMIT = 4 here would be a compile error, which is the point of them.
	if counter < LIMIT {
		fmt.println(GREETING, "— the counter is still small")
	}

	// defer queues a statement for the moment this scope ends. It does not run
	// now; it runs when the function returns, whatever path it takes.
	defer fmt.println("this prints last, after everything below")

	// Deferred statements run in reverse order — last queued, first run. That
	// "unwind like a stack" behaviour is what makes cleanup read naturally.
	defer fmt.println("...and this prints before the one above it")

	fmt.println("this prints first, although it is written last")
}
