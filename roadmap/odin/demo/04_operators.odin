// 04_operators.odin — arithmetic, comparison, logic and the bitwise family.
//
// Run it with:
//     odin run 04_operators.odin -file
//
// What it shows:
//   * Integer division truncates; mixing floats changes the answer.
//   * Comparison operators produce bool, and && / || short-circuit.
//   * The bitwise operators on integers — including `&~`, which clears bits —
//     and what `~` does.
//   * Why the modulo operator is the one you will use most after arithmetic.
//
// Everything here is one expression at a time; watch the printed values as you
// change the operands, because operators are easier to learn by experiment
// than by reading.

package main

import "core:fmt"

main :: proc() {
	// --- Arithmetic ---
	a := 7
	b := 2

	fmt.println("a + b =", a + b)		// 9
	fmt.println("a - b =", a - b)		// 5
	fmt.println("a * b =", a * b)		// 14
	// Integer division throws the remainder away. 7/2 is 3, not 3.5 — this is
	// the single most common surprise for beginners.
	fmt.println("a / b =", a / b)		// 3
	fmt.println("a % b =", a % b)		// 1  — the remainder

	// The modulo operator is how you test divisibility, wrap an index around a
	// buffer, or extract the last digit of a number.
	fmt.println("even? ", a % 2 == 0)	// false
	fmt.println("seconds part of 125s:", 125 % 60)		// 5

	// Dividing floating point values keeps the fraction. Note the explicit
	// conversions: the language will not mix int and f64 for you.
	ratio := f64(a) / f64(b)
	fmt.printfln("f64(a) / f64(b) = %v", ratio)			// 3.5

	// --- Comparison ---
	// Every comparison yields a bool, and bools compose with && (and) and
	// || (or). `!` negates.
	fmt.println("a == b:", a == b)		// false
	fmt.println("a != b:", a != b)		// true
	fmt.println("a > b :", a > b)		// true
	fmt.println("a <= b:", a <= b)		// false

	in_range := a > 0 && a < 10
	fmt.println("0 < a < 10:", in_range)				// true

	// Short-circuiting is a guarantee, not an optimisation: the right side is
	// not evaluated when the left side already decided the answer. That is what
	// makes a guard like `b != 0 && a/b > 1` safe to write.
	guard := b != 0 && (a / b) > 1
	fmt.println("guarded test:", guard)					// true

	// --- Bitwise ---
	// These operate on the bits of an integer. Written as binary literals, the
	// patterns are legible: each group of four digits is one hexadecimal digit.
	mask := 0b0000_1111		// the low nibble
	value := 0b1010_1010

	fmt.println("value & mask =", value & mask)		// 0b0000_1010 — only shared bits
	fmt.println("value | mask =", value | mask)		// 0b1010_1111 — every set bit
	fmt.println("value &~ mask =", value &~ mask)	// 0b1010_0000 — CLEAR the masked bits

	// `&~` is the operator to notice. It means "AND with the complement of",
	// or in plain language: remove these bits. Turning a flag off is exactly
	// that operation, which is why it appears constantly in Odin code.

	// `~` is the unary complement: every bit flipped. The standard library
	// uses the same operator for the same reason when it defines the smallest
	// value of a signed type as the complement of the largest.
	small := u8(0b0000_1111)
	fmt.println("~small (as u8) =", ~small)			// 0b1111_0000

	// Shifting moves bits left or right. Left means multiply by two, right
	// means divide by two for unsigned values.
	fmt.println("1 << 4 =", 1 << 4)					// 16
	fmt.println("32 >> 3 =", 32 >> 3)				// 4

	// A realistic combination: extract three bits and report them as a number,
	// the way you would read a field out of a packed instruction or a header.
	packed := 0b1101_0110
	field := (packed >> 2) & 0b0000_0111
	fmt.println("bits 2..4 of packed:", field)		// 0b101 = 5

	// --- The elementary mistake worth seeing once ---
	// ~ and &~ are not the same operator, and confusing them turns a flag off
	// when you meant to inspect it. Compare the two lines above and below.
	fmt.println("complement of mask:", ~mask)
	fmt.println("clear with mask:  ", value &~ mask)
}
