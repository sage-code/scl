// 06_procedures.odin — results, named returns, defaults, and defer in practice.
//
// Run it with:
//     odin run 06_procedures.odin -file
//
// What it shows:
//   * A procedure with several results, and how the caller receives them.
//   * Named results: the names are real variables, so `return` can be bare.
//   * Default parameter values, which remove the wrapper procedures you would
//     otherwise write.
//   * `defer` inside a procedure — cleanup that survives every exit path.
//
// The theme is that a procedure's signature carries the whole contract: what
// goes in, what comes out, and whether anything implicit is needed.

package main

import "core:fmt"

// One result: the ordinary case. Nothing is implicit.
add :: proc(a, b: int) -> int {
	return a + b
}

// Two results: the value and whether it was real. This is the "simple shape"
// from the errors lesson, and it is the most common signature in Odin.
divide :: proc(a, b: int) -> (result: int, ok: bool) {
	if b == 0 {
		return 0, false		// refuse, and say so — no division happens
	}
	return a / b, true
}

// Named results are declared variables. They are zero-valued on entry, and a
// bare `return` hands them back. That makes "fill in the fields and finish"
// read better than a long tuple of values at the end.
statistics :: proc(values: []int) -> (minimum, maximum, total: int) {
	minimum = values[0]
	maximum = values[0]
	for v in values {
		if v < minimum {
			minimum = v
		}
		if v > maximum {
			maximum = v
		}
		total += v
	}
	return			// minimum, maximum and total travel as they stand
}

// Default values mean one procedure instead of three wrappers. A caller may
// pass just the required argument and accept the defaults, or supply more.
greet :: proc(name: string, greeting := "hello") {
	fmt.println(greeting, name)
}

main :: proc() {
	fmt.println("add(2, 3) =", add(2, 3))

	// Receiving two results is one statement: both names exist afterwards.
	quotient, ok := divide(10, 2)
	fmt.println("divide(10, 2) =", quotient, "ok:", ok)

	// Unwanted results are discarded with `_`, never silently ignored.
	_, bad := divide(1, 0)
	fmt.println("divide(1, 0) ok:", bad)

	// A procedure can also be called purely for its effect, and the results
	// dropped as a whole — useful when you only care whether it worked.
	answer, good := divide(9, 3)
	if good {
		fmt.println("9 / 3 =", answer)
	}

	// Named results come back as variables, ready to print.
	low, high, sum := statistics([]int{4, 9, -2, 7})
	fmt.println("min:", low, "max:", high, "sum:", sum)

	// Defaults in action: the same procedure called two different ways.
	greet("world")
	greet("odin", "welcome back,")

	// --- defer inside a procedure ---
	// Deferred statements run when the procedure returns — including when it
	// returns early. That is what makes them the right place for cleanup.
	with_cleanup()

	// The returned value is computed first, then the deferred work runs. If
	// you ever need to see the order, this is the demo to add prints to.
	fmt.println("result from a procedure that cleans up:", compute())
}

// This procedure prints its own trace so the ordering is visible in the output.
with_cleanup :: proc() {
	fmt.println("work: starting")
	defer fmt.println("cleanup: runs on return, whatever happened")

	fmt.println("work: finished")
}

// A deferred statement runs before the procedure returns, so a print placed
// there always appears — even on a path that returns early.
compute :: proc() -> int {
	defer fmt.println("compute: cleanup ran before returning")
	return 41
}
