// 07_structs_enums.odin — structs, enums, bit sets and unions.
//
// Run it with:
//     odin run 07_structs_enums.odin -file
//
// What it shows:
//   * A struct groups fields, and a struct VALUE is a value: assigning it
//     copies every field, so the original is untouched.
//   * An enum names a fixed set of options, so no number appears in your code.
//   * A bit_set packs yes/no flags into one small integer.
//   * A union holds one of several types at a time and must be asked before it
//     is read.
//
// These four shapes answer four different questions, and between them they
// cover almost every data model you will build by hand.

package main

import "core:fmt"

// --- struct: group related fields ---
// Fields may be given default values, which the compiler fills in whenever a
// literal leaves them out.
Point :: struct {
	x, y: int,
}

Segment :: struct {
	start: Point,		// a struct inside a struct
	end:   Point,
	name:  string,
}

// --- enum: name the options ---
// With no explicit values the members number from zero in the order written,
// and the compiler will not let a plain integer stand in for one of them.
Direction :: enum {
	North,
	East,
	South,
	West,
}

// --- bit_set: several yes/no answers in one value ---
Permission  :: enum { Read, Write, Execute }
Permissions :: bit_set[Permission]

// --- union: one value, several possible types ---
// The compiler records which type is live and refuses to let you read it as
// anything else without asking.
Reading :: union {
	int,
	f64,
	string,
}

main :: proc() {
	// --- Structs are values ---
	a := Point{1, 2}
	b := a				// this COPIES the struct, field by field

	b.x = 99			// changing the copy...

	fmt.println("a:", a)			// {1, 2}  — ...left the original alone
	fmt.println("b:", b)			// {99, 2}

	// A nested struct is initialised by nesting the literals. Field names may
	// be written out, which is worth doing whenever a position is not obvious.
	path := Segment{{0, 0}, {3, 4}, "diagonal"}
	fmt.println("path end:", path.end, "named:", path.name)

	// --- Enums ---
	// Members are reached through the type name, and `switch` understands them.
	heading := Direction.North
	switch heading {
	case .North:
		fmt.println("heading north")
	case .South:
		fmt.println("heading south")
	case:
		// The fallback still exists; enums do not remove the need for one.
		fmt.println("heading east or west")
	}

	// With no values assigned, the members number from zero. Comparing with
	// `==` is fine, but avoid printing the number as if it meant something.
	fmt.println("heading == .North:", heading == Direction.North)

	// --- bit_set ---
	// A set literal names its members. Under the surface this is one integer
	// with one bit per possible member, so it costs a byte at most.
	perms: Permissions = { .Read, .Write }
	fmt.println("perms:", perms)					// Permissions{Read, Write}

	// Membership asks a question with `in`, or `not_in` for the other way.
	fmt.println(".Read in perms :", .Read in perms)			// true
	fmt.println(".Execute in perms:", .Execute in perms)	// false

	// Adding a member reads as "this set, plus that one".
	perms = perms + { .Execute }
	fmt.println("after adding Execute:", perms)

	// Removing one uses the bitwise family from the operators demo: AND with
	// the complement, which is the operation "keep everything except this".
	perms = perms &~ { .Write }
	fmt.println("after removing Write:", perms)

	// --- unions ---
	// A union literal names its type, so the compiler knows which tag to set.
	value := Reading(42)
	fmt.println("union holds:", value)

	// Ask before you read. The assertion has the two-value shape you already
	// know from map lookups: the value, and whether it was that type.
	if i, ok := value.(int); ok {
		fmt.println("it is an int:", i)
	} else {
		fmt.println("it is not an int")
	}

	// When a fallback is more useful than a branch, or_else says it in a line.
	fmt.println("as int   :", value.(int) or_else -1)		// 42
	fmt.println("as string:", value.(string) or_else "n/a")	// n/a

	// The same union can hold a different type next, and the tag follows along.
	value = "text"
	fmt.println("now it holds:", value)
	fmt.println("as f64:", value.(f64) or_else 0.0)			// 0 — not an f64
}
