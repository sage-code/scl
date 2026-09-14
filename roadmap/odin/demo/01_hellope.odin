// 01_hellope.odin — your first Odin program, assembled from the parts of Phase 1.
//
// Run it with:
//     odin run 01_hellope.odin -file
// The -file flag is what you need when you compile a single file rather than a
// directory: the file is then treated as a package of its own.
//
// What to look at, because these four things are the whole skeleton:
//   * `package main`  — an executable starts by naming its package.
//   * `main :: proc()` — the entry point. Nothing in your code calls it.
//   * `fmt.println`   — writes values and a newline to standard output.
//   * `%v`            — "print this value in its default form".
//
// Change the values at the bottom and re-run: nothing else needs adjusting.

package main

import "core:fmt"

main :: proc() {
	// A string literal, printed exactly as written. println supplies the newline.
	fmt.println("Hello, odin!")

	// printfln puts a format string and its values together. %v is the verb to
	// reach for while learning: it works for integers, floats, strings and
	// structs without you having to remember a different letter for each.
	name := "world"
	answer := 42
	fmt.printfln("hello, %v — the answer is %v", name, answer)

	// println also accepts several arguments and puts one space between them.
	// For a quick diagnostic this is often all the formatting you need.
	fmt.println("name:", name, "answer:", answer)

	// A procedure body is a block of statements that run in order, top to
	// bottom. That is the entire control flow of this program — later demos
	// add decisions and loops to the same shape.
}
