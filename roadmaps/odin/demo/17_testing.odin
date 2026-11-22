// 17_testing.odin — tests as ordinary procedures, checked by core:testing.
//
// Two ways to use this file:
//     odin run 17_testing.odin -file       — compile and run the main below
//     odin test .                          — from a folder containing this file,
//                                             run every @(test) procedure
//
// What it shows:
//   * A test is a normal procedure marked with `@(test)` that takes exactly
//     one argument: `^testing.T`.
//   * `testing.expect` checks a condition; `testing.expect_value` compares a
//     result against the value you expect and remembers both.
//   * A test that finishes without failing has passed — so expectations are
//     how a test earns its result.
//   * The test runner is multi-threaded and tracks memory by default, so a test
//     that leaks is reported even when every expectation held.
//
// Write the message in `expect` for the person who will read the failure —
// which is usually you, several months later.

package main

import "core:fmt"
import "core:testing"

// --- The code under test ---
// Ordinary procedures, in the same package as the tests. Nothing is exported
// and nothing is rearranged to make testing possible: in Odin, `private` means
// private to the package, and a test lives in the package.

// Sum the rune values of a string — small enough to reason about, and it
// produces a different number for a wrong implementation.
simple_hash :: proc(text: string) -> (result: int) {
	for ch in text {
		result += int(ch)
	}
	return
}

// Clamp a value into a range. The upper bound is inclusive, which is the kind
// of detail a test should pin down.
clamp :: proc(value, low, high: int) -> int {
	if value < low {
		return low
	}
	if value > high {
		return high
	}
	return value
}

// Reverse a string into freshly allocated memory. The caller owns the result,
// which is exactly what the memory tracking in the test runner will notice if
// it is forgotten.
reverse :: proc(text: string, allocator := context.allocator) -> []u8 {
	out := make([]u8, len(text), allocator)

	for ch, i in text {
		out[len(text)-1-i] = u8(ch)
	}
	return out
}

// --- The tests ---

// The smallest possible test: it takes the required argument and does nothing.
// It passes, and that is the whole ceremony.
@(test)
always_passes :: proc(t: ^testing.T) {
	// Nothing to check here; this test exists to show the minimum shape.
}

@(test)
hash_is_stable :: proc(t: ^testing.T) {
	hash := simple_hash("hellope")

	// expect_value keeps both numbers, so a failure prints both of them.
	// Quoted from the testing documentation: "expected 745, got 752".
	testing.expect_value(t, hash, 745)

	// A test may hold as many expectations as it needs. When the first one
	// fails, the failure names the file and line — so several small tests are
	// easier to diagnose than one enormous one.
	testing.expect(t, simple_hash("") == 0, "the empty string should hash to zero")
}

@(test)
clamp_bounds_are_inclusive :: proc(t: ^testing.T) {
	testing.expect_value(t, clamp(5, 1, 10), 5)		// inside: unchanged
	testing.expect_value(t, clamp(0, 1, 10), 1)		// below: raised
	testing.expect_value(t, clamp(99, 1, 10), 10)	// above: lowered
	testing.expect_value(t, clamp(10, 1, 10), 10)	// exactly the bound
}

@(test)
reverse_keeps_the_length :: proc(t: ^testing.T) {
	reversed := reverse("odin")

	// The test allocated, so the test releases. The runner tracks memory, so a
	// forgotten delete here would be reported as a problem even though every
	// expectation below held — which is the point of deferring it immediately.
	defer delete(reversed)

	// A plain condition, with a message written for the reader.
	testing.expect(t, len(reversed) == 4, "reversing must not change the length")

	// Comparing against an expected value, so a failure shows both strings.
	testing.expect_value(t, string(reversed), "nido")

	// Deliberately fail, to see what the runner prints. Remove the guard to
	// watch the failure report, then put it back — a failing test is one of the
	// most useful things to look at once.
	when false {
		testing.expect_value(t, string(reversed), "this is not it")
	}
}

// --- A main so the file can also be run directly ---
// When you run the file, this shows the same calls the tests make; when you run
// `odin test`, the tests run instead and this main is not the point.
main :: proc() {
	fmt.println("simple_hash(\"hellope\") =", simple_hash("hellope"))
	fmt.println("clamp(99, 1, 10)      =", clamp(99, 1, 10))

	backwards := reverse("odin")
	defer delete(backwards)			// main owns it, main releases it
	fmt.println("reverse(\"odin\")       =", string(backwards))

	// The tests in this file assert exactly these values. Running the file is
	// how you look at them; running `odin test` is how you keep them true.
	fmt.println("run `odin test .` to check every @(test) procedure in this file")
}
