// 03_types.odin — the type families, widths, conversions and distinct types.
//
// Run it with:
//     odin run 03_types.odin -file
//
// What it shows:
//   * The four families (boolean, integer, floating point, string) and how to
//     ask the compiler about them with size_of and type_of.
//   * Why Odin refuses to mix integer widths in one expression.
//   * The difference between a conversion (`T(value)`) — same bits, new type —
//     and a cast (`cast(T)value`), which is the deliberate, explicit escape.
//   * `distinct` — a new type with the same representation and none of the
//     automatic mixing.
//
// The rule to take away: nothing converts silently. Every width change is
// written down, so a reader never has to guess what the compiler did.

package main

import "core:fmt"

// A distinct type is a new type that shares its representation with the one it
// is based on. Meters and Seconds are both integers underneath, and the
// compiler will not let you add one to the other.
Meters :: distinct int
Seconds :: distinct int

main :: proc() {
	// --- Sizes are a property of the type, not of the machine you are on ---
	// The fixed-width names (u8, i32, f64) mean exactly what they say
	// everywhere. The plain `int` follows the platform word size.
	fmt.println("size_of(u8) :", size_of(u8))		// 1
	fmt.println("size_of(i32):", size_of(i32))		// 4
	fmt.println("size_of(int):", size_of(int))		// 4 on 32-bit, 8 on 64-bit
	fmt.println("type_of(3.5):", type_of(3.5))		// the untyped literal's default

	// --- Integers and floating point ---
	// Unsigned types hold only non-negative values; signed types pay for
	// negative numbers with one bit. Choose by what the value means.
	var count: u32 = 4_000_000_000		// underscores are for the reader only
	var delta: i32 = -25

	// Floating point comes in two widths: f32 for storage, f64 for arithmetic
	// you care about. A literal with a fraction is f64 unless told otherwise.
	var half: f32 = 0.5
	var precise: f64 = 0.1

	fmt.println(count, delta, half, precise)

	// --- Nothing mixes silently ---
	// Uncommenting the next line would not compile: i32 and i64 are different
	// types even though both are integers. Write the conversion on purpose.
	// total := delta + 1		// fine — the literal adapts
	// mixed := delta + count	// ERROR: signed and unsigned, different widths
	sum := i64(delta) + i64(count)
	fmt.println("converted sum:", sum)

	// A conversion keeps the bits and reinterprets the type. Converting a
	// value that does not fit is defined but surprising, which is why it is
	// spelled out: 300 does not fit in a u8.
	var too_big: u8 = u8(300 % 256)
	fmt.println("u8(300 % 256):", too_big)		// 44

	// A cast is the blunter instrument: it tells the compiler "treat these
	// bits as this type" without applying the conversion rules. Reach for it
	// when you are doing something the type system could not be asked to
	// express — reading bytes as a number, or talking to C.
	bits := cast(u8)0b1010_1101
	fmt.println("cast from a binary literal:", bits)	// 173

	// --- Distinct types keep ideas apart ---
	distance := Meters(120)
	elapsed := Seconds(9)

	fmt.println("distance:", distance, "elapsed:", elapsed)
	// fmt.println(distance + elapsed)	// ERROR: Meters and Seconds differ
	// The conversion between them must be written, which is exactly the
	// reminder you want when two numbers that look alike are not the same thing.
	speed := f64(distance) / f64(elapsed)
	fmt.printfln("speed: %v units per second", speed)

	// --- Strings are values, and equality compares content ---
	left := "odin"
	right := "od" + "in"
	fmt.println("equal content:", left == right)	// true
	fmt.println("length in bytes:", len(left))		// 4
}
