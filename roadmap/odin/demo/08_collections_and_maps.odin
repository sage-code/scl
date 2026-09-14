// 08_collections_and_maps.odin — arrays, slices, dynamic arrays and maps.
//
// Run it with:
//     odin run 08_collections_and_maps.odin -file
//
// What it shows:
//   * A fixed array is the array; its length is part of its type.
//   * A slice is a VIEW: a pointer plus a length, holding no data of its own.
//   * A dynamic array owns memory, so it must be freed.
//   * A map gives absent keys the zero value, which makes counting a one-liner.
//
// Keep the three-part distinction in mind while reading: copy, view, own.
// Almost every bug in collection code comes from confusing those three.

package main

import "core:fmt"
import "core:slice"

main :: proc() {
	// --- Fixed array: the data is here, and the length is in the type ---
	// [5]int and [3]int are different types, and both are values you can copy.
	readings := [5]int{10, 20, 30, 40, 50}

	fmt.println("whole array:", readings)
	fmt.println("length is part of the type:", len(readings))		// 5

	// Copying an array copies all of its elements — no sharing at all.
	backup := readings
	backup[0] = 999
	fmt.println("original untouched:", readings[0])					// 10

	// --- Slice: a window onto an array ---
	// Slicing does not copy. The result is a pointer and a length, so a write
	// through the slice is visible in the array underneath.
	window := readings[1:4]			// elements 1, 2 and 3 — 4 is excluded
	fmt.println("window:", window, "len:", len(window))

	window[0] = 111					// writes into `readings`
	fmt.println("array now:", readings)

	// A slice literal is a slice with no array behind it that you can name.
	// It is the most common way to pass a list to a procedure.
	names := []string{"ada", "grace", "alan"}
	fmt.println("slice literal:", names)

	// --- Dynamic array: this one owns memory ---
	// make allocates; delete releases. Writing them together, with defer in
	// between, is the habit that replaces a garbage collector.
	queue := make([dynamic]int, 0, 4)
	defer delete(queue)				// runs when main returns, on every path

	append(&queue, 1)				// append needs a pointer: it may reallocate
	append(&queue, 2)
	append(&queue, 3)

	fmt.println("dynamic:", queue[:], "len:", len(queue), "cap:", cap(queue))

	// Growing past the reserved capacity is fine; the allocator takes care of
	// it. Reserving up front only saves repeated copying.
	for i in 4..=8 {
		append(&queue, i)
	}
	fmt.println("after growing:", queue[:], "len:", len(queue), "cap:", cap(queue))

	// Elements can be removed from the end, and the array keeps its memory
	// for the next append — which is why popping is cheap.
	last := pop(&queue)
	fmt.println("popped:", last, "len now:", len(queue))

	// --- Maps ---
	// A map also owns memory, so it also gets make and delete.
	words := []string{"spam", "eggs", "spam", "spam", "eggs"}

	tally := make(map[string]int)
	defer delete(tally)

	// Reading a key that is not there gives the zero value — for int, that is
	// 0 — so counting needs no special case for the first sighting.
	for word in words {
		tally[word] = tally[word] + 1
	}

	// Iterating a map hands over the KEY first, then the value.
	for word, count in tally {
		fmt.println(word, "appears", count, "time(s)")
	}

	// The two-value form tells you whether a key was really present, which is
	// the difference between "zero" and "absent".
	if count, found := tally["spam"]; found {
		fmt.println("\"spam\" was found with count", count)
	}
	if _, found := tally["bacon"]; !found {
		fmt.println("\"bacon\" was never seen — not zero, absent")
	}

	// or_else is the short form when absent and zero mean the same thing to you.
	fmt.println("count of \"eggs\":", tally["eggs"] or_else 0)

	// --- Map order is not yours to assume ---
	// When a predictable order matters, gather the keys, sort them, present.
	keys := make([dynamic]string, 0, len(tally))
	defer delete(keys)

	for word, _ in tally {
		append(&keys, word)
	}
	slice.sort(keys[:])				// alphabetical, because the keys are strings

	fmt.print("sorted keys: ")
	for word in keys {
		fmt.print(word, " ")
	}
	fmt.println()

	// --- Selecting a range of a dynamic array ---
	// A slice of a dynamic array is, again, a view — the same rule as above.
	numbers := make([dynamic]int, 0, 8)
	defer delete(numbers)
	for i in 0..<8 {
		append(&numbers, i * i)
	}
	fmt.println("squares:", numbers[:])
	fmt.println("the middle four:", numbers[2:6])
}
