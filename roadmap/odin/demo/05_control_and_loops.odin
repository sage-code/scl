// 05_control_and_loops.odin — if, switch, and every form of for.
//
// Run it with:
//     odin run 05_control_and_loops.odin -file
//
// What it shows:
//   * if / else if / else, and the initialiser form that declares a value in
//     the condition — the pattern you will use for every lookup that can fail.
//   * switch with several values per case, ranges, and `case:` as the fallback.
//   * The four for-loop shapes: range, collection, condition, forever.
//
// Odin has one looping keyword, `for`, and it covers all four shapes. There is
// no `while`, because `for condition { }` already means that.

package main

import "core:fmt"

main :: proc() {
	// --- if / else if / else ---
	score := 78

	if score >= 90 {
		fmt.println("grade A")
	} else if score >= 80 {
		fmt.println("grade B")
	} else if score >= 70 {
		fmt.println("grade C")
	} else {
		fmt.println("grade F")
	}

	// The initialiser form declares a name that exists only inside the if.
	// It is the idiom for "compute something, then test it": the value cannot
	// leak past the block, so it cannot be reused by mistake.
	if doubled := score * 2; doubled > 150 {
		fmt.println("doubled is over 150:", doubled)
	}

	// --- switch ---
	// Cases take a list, so parallel branches become one line instead of three.
	day := 3
	switch day {
	case 1, 7:
		fmt.println("weekend")
	case 2, 3, 4, 5, 6:
		fmt.println("weekday")
	case:
		// `case:` with nothing after it is the catch-all. It cannot be
		// forgotten by accident, which is one reason to prefer switch to a
		// chain of comparisons.
		fmt.println("not a day number")
	}

	// A case can also be a range, which is what you want for bands of values.
	// Ranges appear in switch cases far more often than in loops, because
	// "which band is this reading in" is a common question.
	switch score {
	case 90..=100:
		fmt.println("band: A")
	case 70..=89:
		fmt.println("band: C")
	case:
		fmt.println("band: low")
	}

	// --- for: over a range ---
	// 0..<n is exclusive of n, so it is the safe form for indexing.
	for i in 0..<3 {
		fmt.println("range 0..<3:", i)		// 0, 1, 2
	}

	// 1..=n is inclusive of n — useful for counting real things, like "day 1
	// to day 5", where skipping the last item would be wrong.
	for i in 1..=3 {
		fmt.println("range 1..=3:", i)		// 1, 2, 3
	}

	// --- for: over a collection ---
	// With one name you get the value. With two, the second is the index.
	names := []string{"ada", "grace", "alan"}
	for name in names {
		fmt.println("name:", name)
	}
	for name, index in names {
		fmt.println("index", index, "holds", name)
	}

	// `_` discards a value you do not need. The compiler is strict about
	// unused names, so writing `_` is how you say "deliberately ignored".
	for _, index in names {
		fmt.println("only the index matters:", index)
	}

	// --- for: while a condition holds ---
	// There is no `while` keyword; a condition in place of the header is the
	// same thing. Keep a `break` inside so the loop cannot run forever.
	countdown := 3
	for countdown > 0 {
		fmt.println("countdown:", countdown)
		countdown -= 1
	}

	// --- for: forever, with an exit ---
	// A bare `for` never ends on its own, so it needs a `break`. This form is
	// the shape of an event loop, a server, or a REPL.
	attempts := 0
	for {
		attempts += 1
		if attempts == 3 {
			fmt.println("giving up after", attempts, "attempts")
			break			// leaves the loop entirely
		}
	}

	// `continue` skips to the next iteration instead of leaving. Both keywords
	// are plain statements, and both work in every shape above.
	total := 0
	for i in 0..<10 {
		if i % 2 != 0 {
			continue		// ignore odd numbers
		}
		total += i
	}
	fmt.println("sum of the even numbers below 10:", total)		// 20

	// --- Labelled loops: leaving two loops at once ---
	// A `break` inside a nested loop only leaves the inner one. When you need
	// to leave both, label the outer loop and name the label in the break.
	// This is the idiom the official Odin examples use for searching a grid.
	grid := [3][3]int{
		{1, 2, 3},
		{4, 5, 6},
		{7, 8, 9},
	}

	search: for row, y in grid {
		for value, x in row {
			if value == 5 {
				// `break search` leaves the OUTER loop, not just the inner one,
				// so no flag variable is needed to carry the answer out.
				fmt.printfln("found 5 at x=%v y=%v", x, y)
				break search
			}
		}
	}
}
