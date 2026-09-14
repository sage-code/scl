// 12_errors.odin — errors as values: the two-value shape, or_return, or_else.
//
// Run it with:
//     odin run 12_errors.odin -file
//
// What it shows:
//   * Failure is a RESULT, not an exception: the caller cannot ignore it by
//     accident, and nothing unwinds behind your back.
//   * The simple shape `(value, ok)` versus the richer shape `(value, err)`.
//   * `or_return` — "if this failed, hand it straight back to my caller".
//   * `or_else` — "give me the value, or this fallback".
//
// Read the signatures first, then the bodies. In Odin, what a procedure can do
// is visible in its result list, which is the whole design.

package main

import "core:fmt"

// The richer shape: an enum says which failure happened, and the caller can
// choose to handle one case differently from another.
Parse_Error :: enum {
	None,			// the zero value means "no error"
	Empty,
	Not_A_Digit,
}

// Parsing digits by hand, so the failure paths are visible. A real program
// would use the standard library's conversion procedures instead.
parse_count :: proc(text: string) -> (count: int, err: Parse_Error) {
	if len(text) == 0 {
		return 0, .Empty		// return early, with the reason
	}

	total := 0
	for ch in text {
		if ch < '0' || ch > '9' {
			return 0, .Not_A_Digit
		}
		// Characters are numbers: subtracting '0' turns a digit glyph into
		// the digit's value.
		total = total * 10 + int(ch - '0')
	}

	return total, .None
}

// or_return propagates a failure without any ceremony: if parse_count fails,
// this procedure returns immediately, carrying the same error back.
// The error type must match, which is what makes the shorthand possible.
double_count :: proc(text: string) -> (doubled: int, err: Parse_Error) {
	count := parse_count(text) or_return
	return count * 2, .None
}

// The simple shape, for failures that need no explanation.
first_char_upper :: proc(text: string) -> (char: u8, ok: bool) {
	if len(text) == 0 {
		return 0, false			// nothing to give back, and we say so
	}
	return text[0], true
}

main :: proc() {
	// --- Handling the result ---
	count, err := parse_count("123")
	if err != .None {
		// An enum compares with ==, so the specific failure is testable.
		fmt.eprintln("parsing failed:", err)
	} else {
		fmt.println("parsed:", count)			// 123
	}

	// A switch is the natural shape when several failures are possible:
	// each one can get its own response. (Note: the value is received first,
	// because Odin's switch takes an expression, not an initialiser.)
	_, e := parse_count("12x")

	switch e {
	case .None:
		fmt.println("that one was fine")
	case .Empty:
		fmt.println("nothing was given")
	case .Not_A_Digit:
		fmt.println("letters are not digits")
	}

	// --- The compiler insists on the results being used ---
	// `count` and `err` were both received above. Ignoring a result that the
	// language says matters is a compile error, which is the point: the failure
	// cannot be forgotten, only handled.
	if _, e := parse_count(""); e != .None {
		fmt.println("empty input rejected as expected")
	}

	// --- or_return in a chain ---
	// Two levels of call, one failure path. Note that nothing here re-checks
	// the error — or_return already did.
	doubled, derr := double_count("21")
	if derr == .None {
		fmt.println("21 doubled is", doubled)
	}

	// A failure travels the same way, and stops the chain at its source.
	_, failure := double_count("2a")
	fmt.println("failure propagates as:", failure)		// Not_A_Digit

	// --- or_else: a fallback instead of a branch ---
	// Use this when "failed" and "a safe default" mean the same thing to you.
	fallback := parse_count("nope") or_else -1
	fmt.println("with a fallback:", fallback)		// -1

	// --- The simple shape ---
	ch, ok := first_char_upper("odin")
	if ok {
		fmt.println("first byte:", ch)		// 111 — the byte for 'o'
	}
	if _, none := first_char_upper(""); !none {
		fmt.println("empty input has no first byte")
	}

	// --- Why the two-value shape is everywhere ---
	// The same pattern appears in `if` initialisers, map lookups and union
	// assertions. Once you recognise it, Odin's standard library reads as one
	// repeated convention rather than a collection of special cases.
}
