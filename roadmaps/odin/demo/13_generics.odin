// 13_generics.odin — $T parameters, where clauses, and a generic struct.
//
// Run it with:
//     odin run 13_generics.odin -file
//
// What it shows:
//   * `$T` names a type the compiler infers from the call.
//   * A `where` clause constrains what that type may be, using intrinsics.
//   * A struct can take a type parameter: that is how containers are written.
//   * There is no runtime dispatch anywhere — one compiled version per type
//     your program actually uses.
//
// A generic procedure is an instruction to the compiler, not a feature of the
// running program. That is why it costs nothing at run time.

package main

import "core:fmt"
import "core:intrinsics"

// One body, any type. The `$` appears on the FIRST use of the name; every later
// use is the bare name, here in the result type.
max_value :: proc(values: []$T) -> T {
	best := values[0]
	for v in values[1:] {
		if v > best {
			best = v
		}
	}
	return best
}

// A where clause narrows the type. This one accepts any integer type and
// rejects everything else — floats, strings, structs — at compile time.
add_up :: proc(values: []$T) -> T where intrinsics.type_is_integer(T) {
	total: T			// the zero value of whatever T turns out to be
	for v in values {
		total += v
	}
	return total
}

// A generic STRUCT: the parameters sit between the keyword and the body. This
// is how a stack, queue or cache is written in Odin — the container does not
// care what it holds.
Stack :: struct($T: typeid) {
	items: [dynamic]T,
}

// Procedures over a generic struct name the instantiation in their parameter
// list: `Stack($T)` means "a Stack of whatever T is here".
stack_push :: proc(s: ^Stack($T), item: T) {
	append(&s.items, item)
}

stack_pop :: proc(s: ^Stack($T)) -> (item: T, ok: bool) {
	if len(s.items) == 0 {
		return item, false		// `item` is zero-valued; ok says it is not real
	}
	return pop(&s.items), true
}

main :: proc() {
	// --- The type is inferred from the arguments ---
	// These two calls compile to separate versions of the same body, and there
	// is no check at run time that the type is comparable.
	fmt.println("max of ints :", max_value([]int{3, 9, 4}))			// 9
	fmt.println("max of f64s :", max_value([]f64{1.5, 0.5}))		// 1.5
	fmt.println("max of u8s  :", max_value([]u8{7, 2, 5}))			// 7

	// Strings work with the same body, because `>` is defined for string
	// comparison. Nothing about the procedure mentioned strings.
	fmt.println("max of names:", max_value([]string{"ada", "grace", "alan"}))

	// --- The where clause refuses the wrong type ---
	fmt.println("sum of ints :", add_up([]int{1, 2, 3, 4}))
	fmt.println("sum of u16s :", add_up([]u16{10, 20, 30}))
	// add_up([]f64{1.0, 2.0})		// would not compile: f64 is not an integer
	// That refusal is the value of the constraint: the error appears while the
	// program is being built, not when a customer runs it.

	// --- A generic struct in use ---
	// Writing Stack(int) names the instantiation. The compiler produces a
	// struct whose items field is a [dynamic]int, and nothing more.
	numbers := Stack(int){}
	defer delete(numbers.items)			// the container owns a dynamic array

	stack_push(&numbers, 10)
	stack_push(&numbers, 20)
	stack_push(&numbers, 30)
	fmt.println("stack holds:", numbers.items[:])

	// The same generic code, for a different element type — a second compiled
	// instantiation, and not one line of duplicated source.
	words := Stack(string){}
	defer delete(words.items)

	for word in []string{"first", "second", "third"} {
		stack_push(&words, word)
	}

	// Popping returns the two-value shape, so an empty stack is a normal
	// outcome rather than a crash.
	for {
		word, ok := stack_pop(&words)
		if !ok {
			fmt.println("stack is empty — stopping")
			break				// last-in, first-out: the order is reversed
		}
		fmt.println("popped:", word)
	}
}
