// 10_allocators.odin — make, new, delete, free, and the temporary allocator.
//
// Run it with:
//     odin run 10_allocators.odin -file
//
// What it shows:
//   * Every allocation names an allocator; the default comes from the context.
//   * `make`/`delete` for slices, dynamic arrays and maps; `new`/`free` for a
//     single value.
//   * `context.temp_allocator` — scratch space that is discarded wholesale.
//   * Passing an allocator as a parameter with a default, so the caller can
//     choose where the memory comes from.
//
// The habit to copy: write the release immediately below the acquisition, as a
// `defer`. Odin has no garbage collector, so the pairing is the whole strategy.

package main

import "core:fmt"
import "core:strings"

// A procedure that allocates should let the caller choose the allocator. The
// default means "use whatever this scope normally uses", so the common call
// stays short while the unusual one stays possible.
build_sequence :: proc(count: int, allocator := context.allocator) -> []int {
	// make with an explicit allocator — this is the line that makes the memory
	// source visible to the reader.
	values := make([]int, count, allocator)

	for i in 0..<count {
		values[i] = i * i
	}
	return values		// the caller now owns this memory and must delete it
}

main :: proc() {
	// --- The default allocator, used explicitly ---
	// `make([]int, 5)` takes memory from context.allocator, the general-purpose
	// one. Writing it out changes nothing here, and shows where it comes from.
	numbers := make([]int, 5, context.allocator)
	defer delete(numbers)			// one delete for the whole slice

	for i in 0..<5 {
		numbers[i] = i + 1
	}
	fmt.println("numbers:", numbers)

	// --- A single value: new and free ---
	// new returns a POINTER to freshly allocated memory, already zeroed.
	counter := new(int)				// counter is a ^int
	defer free(counter)				// free takes the pointer back

	counter^ = 7
	fmt.println("counter:", counter^)		// 7, written through the pointer

	// --- Dynamic array: the collection owns its buffer ---
	names := make([dynamic]string, 0, 4)
	defer delete(names)

	append(&names, "ada")
	append(&names, "grace")
	fmt.println("names:", names[:], "cap:", cap(names))

	// --- Map: also an owner ---
	ages := make(map[string]int)
	defer delete(ages)

	ages["ada"] = 36
	ages["grace"] = 85
	fmt.println("ages:", len(ages), "entries")

	// --- The temporary allocator: scratch space ---
	// This is the one to reach for when memory only needs to live until the
	// end of the scope. Nothing is freed individually: `free_all` resets the
	// whole region in one step, which is why it is fast and why you must never
	// hold on to a pointer past the reset.
	{
		scratch := make([]u8, 128, context.temp_allocator)
		defer free_all(context.temp_allocator)		// discard everything at once

		for i in 0..<len(scratch) {
			scratch[i] = u8('a' + (i % 26))
		}
		fmt.println("scratch (first 12):", string(scratch[:12]))

		// A C string cloned into scratch space: correct for a value that only
		// needs to survive the call it is handed to.
		label := strings.clone_to_cstring("temporary label", context.temp_allocator)
		fmt.println("cstring:", label)
	}	// <-- the temporary region is released here, all at once

	// --- Passing the choice of allocator to a procedure ---
	// Default argument: general-purpose allocator.
	squares := build_sequence(6)
	defer delete(squares)
	fmt.println("squares:", squares)

	// Explicit argument: temporary allocator. The caller decided; the procedure
	// did not need to know.
	short_lived := build_sequence(4, context.temp_allocator)
	fmt.println("short lived:", short_lived)

	// The last region is released when main ends; deferring free_all earlier
	// would be wrong, because it would discard memory still in use.
	defer free_all(context.temp_allocator)

	// --- What the pairing buys you ---
	// Four acquisitions above, four releases. Nothing here needs a collector,
	// and nothing leaks: the pairs are visible on adjacent lines, and `defer`
	// guarantees each release runs even if a procedure returns early.
	fmt.println("done — every acquisition had a matching release")
}
