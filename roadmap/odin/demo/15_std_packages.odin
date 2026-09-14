// 15_std_packages.odin — core packages, aliases, and passing arguments in.
//
// Run it with:
//     odin run 15_std_packages.odin -file
// Then run it again with arguments, which is what makes this a program rather
// than a demonstration:
//     odin run 15_std_packages.odin -file -- alpha beta gamma
// (Everything after -- is passed to your program, not to the compiler.)
//
// What it shows:
//   * Importing from `core:` and reaching names through the package name.
//   * An alias import, for a name that is long or used constantly.
//   * `os.args` — the program's own command line, including its own name at
//     index 0.
//   * `slice.sort` and `strings.Builder` doing work you would otherwise write.
//
// Only core packages are used, so nothing has to be installed beyond the
// compiler itself.

package main

import "core:fmt"
import "core:os"
import "core:slice"
import "core:strings"

// An alias gives a package a second, shorter name at the point of use. Here the
// same library is imported twice — once as `strings`, once as `st` — so you can
// see that the package name is part of the call, not part of the library.
import st "core:strings"

main :: proc() {
	// --- The command line ---
	// os.args holds the path to the executable followed by every argument.
	// Index 0 is the program itself, so a program with no arguments still has
	// one entry to look at.
	fmt.println("arguments received:", len(os.args))

	for arg, index in os.args {
		fmt.println(" ", index, ":", arg)
	}

	if len(os.args) == 1 {
		fmt.println("(no arguments: pass some after -- to see them listed)")
	}

	// --- Sorting with the standard library ---
	// A slice is sorted in place, and the element type decides how. Strings
	// compare alphabetically, which is the comparison you would have written.
	names := []string{"grace", "ada", "alan", "barbara"}
	slice.sort(names)
	fmt.println("sorted:", names)

	// Numbers too, including negative values, because the ordering is defined
	// by the type rather than by the sort procedure.
	scores := []int{42, -7, 19, 0}
	slice.sort(scores)
	fmt.println("sorted scores:", scores)

	// --- Building a string ---
	// A Builder collects pieces and hands back one string at the end. Writing
	// pieces into it is cheap; the single to_string call produces the result.
	builder := strings.builder_make()
	defer strings.builder_destroy(&builder)

	strings.write_string(&builder, "report:")
	for name in names {
		strings.write_string(&builder, " ")
		strings.write_string(&builder, name)
	}

	text := strings.to_string(builder)
	fmt.println(text)

	// --- The same package under a different name ---
	// A second import of the same library under an alias, for comparison. Both
	// names reach the same code; only the spelling at the call site changes.
	alias_builder := st.builder_make()
	defer st.builder_destroy(&alias_builder)

	st.write_string(&alias_builder, "written through the alias")
	fmt.println(st.to_string(alias_builder))

	// --- Why packages are named briefly ---
	// Every name is qualified, so the package name appears in every call. That
	// is deliberate: it makes the origin of each name obvious, and it is why
	// the standard library's names are short. When a name is not short, an
	// alias is the remedy — exactly as the line above shows.

	// --- One more piece of the collection ---
	// `os` is the platform-facing package: arguments, environment, files and
	// processes. Its procedures come in platform-specific files inside the
	// library, and the ones you call look the same on every platform.
	// `fmt`, `slice` and `strings` are the everyday companions for output,
	// collections and text.
}
