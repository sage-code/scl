// 14_compile_time.odin — when, #assert, and asking about your own build.
//
// Run it with:
//     odin run 14_compile_time.odin -file
// And compare with a debug-shaped build, which is what you get by default:
//     odin run 14_compile_time.odin -file -o:speed
//
// What it shows:
//   * `when` chooses between blocks while the program is being BUILT. The
//     branch not taken is not compiled at all.
//   * Odin's own constants — ODIN_OS, ODIN_ARCH, ODIN_DEBUG — describe the
//     build you are in, and they are ordinary compile-time values.
//   * `#assert` states a fact the compiler must be able to prove.
//   * A constant expression can compute a table, so the run-time code is the
//     short part.
//
// The difference from `if` is the important one: an `if` decides at run time
// between code that exists; a `when` decides at compile time which code exists.

package main

import "core:fmt"

// A compile-time constant computed from the platform. Nothing here runs at
// start-up: the value is fixed while the file is being compiled.
WORD_SIZE :: size_of(uintptr) * 8

// `when` at package level selects a definition. Only one of these constants
// ends up in the program.
when ODIN_OS == .Windows {
	PLATFORM_NOTE :: "running on Windows"
} else when ODIN_OS == .Linux {
	PLATFORM_NOTE :: "running on Linux"
} else when ODIN_OS == .Darwin {
	PLATFORM_NOTE :: "running on macOS"
} else {
	PLATFORM_NOTE :: "running on some other system"
}

// A fact the compiler must be able to prove. If it cannot, the build stops
// here with a message — which is exactly where you want to learn about a
// mistake in the assumptions your code rests on.
#assert(size_of(u8) * 8 == 8)
#assert(size_of(u32) == 4)

main :: proc() {
	// --- The platform constant ---
	// One message, chosen at compile time. The other two branches were never
	// compiled, so they cannot slow anything down or fail a check.
	fmt.println(PLATFORM_NOTE)
	fmt.println("word size in bits:", WORD_SIZE)

	// --- when inside a procedure ---
	// The same mechanism selects the statements that exist. It reads like an
	// `if`, and means something quite different.
	when ODIN_ARCH == .amd64 {
		fmt.println("64-bit x86 build: the words are eight bytes wide")
	} else when ODIN_ARCH == .arm64 {
		fmt.println("64-bit ARM build: the words are eight bytes wide")
	} else {
		fmt.println("some other architecture")
	}

	// --- Debug builds are a compile-time fact ---
	// ODIN_DEBUG is true when the build keeps its checking in place, and false
	// in an optimised build. Because this is a `when`, the code between the
	// braces is present or absent from the binary — no branch is tested at run
	// time, and nothing is paid for in the release build.
	when ODIN_DEBUG {
		fmt.println("debug build: the expensive checks below are compiled in")
		// An expensive consistency check belongs here, wrapped in `when
		// ODIN_DEBUG`, so a release build does not carry it at all.
		verify_example_state()
	} else {
		fmt.println("release build: the debugging checks were never compiled")
	}

	// --- Constants computed once, used everywhere ---
	// A constant expression may call anything the compiler can evaluate, so a
	// lookup table can be built here rather than filled in at run time.
	fmt.println("PRIMES table:", SMALL_PRIMES)
	fmt.println("0 is prime?", is_small_prime(0))		// false
	fmt.println("7 is prime?", is_small_prime(7))		// true
	fmt.println("9 is prime?", is_small_prime(9))		// false

	// --- Asking about types ---
	// size_of, type_of and the intrinsics answer questions while compiling.
	// They cost nothing at run time, because there is nothing left to ask.
	value := 3.5
	fmt.println("type_of(3.5)   :", type_of(value))
	fmt.println("size_of(f64)   :", size_of(f64))
	fmt.println("size_of(string):", size_of(string))		// pointer + length
}

// --- A table fixed at compile time ---
// The literal is the whole table; the loop only reads it.
SMALL_PRIMES :: [10]bool{false, false, true, true, false, true, false, true, false, false}

is_small_prime :: proc(n: int) -> bool {
	if n < 0 || n >= len(SMALL_PRIMES) {
		return false
	}
	return SMALL_PRIMES[n]
}

// Called only from a debug build. In a release build this procedure is not
// referenced by anything, and the linker is free to drop it entirely.
verify_example_state :: proc() {
	assert(size_of(int) == size_of(uintptr), "int and uintptr must match")
	fmt.println("  (consistency check passed)")
}
