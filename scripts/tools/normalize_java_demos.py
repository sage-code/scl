#!/usr/bin/env python3
"""Normalize the Java demo folder to the roadmap demo contract.

`manual/ARCHITECTURE.md` §"Demo Example Pages" requires one runnable example per
file named `NN_name.<ext>` inside `roadmap/<track>/demo/`. The Java demo folder
predates that rule: its files are unnumbered, a few carry names that are not
valid Java identifiers (`min-max.java`), and several files are dead weight
(compiled `.class` artifacts, a stray `result.txt`, an HTML page saved with a
`.java` extension, a code fragment with no class, and one byte-identical copy).

The script is deterministic and idempotent:

  * every source name maps to exactly one target name (lesson order)
  * a source that is already numbered is left untouched
  * superseded files are deleted only when the reason is recorded here; a
    byte-identical duplicate is verified by content fingerprint first
  * a missing source or an existing target is reported instead of overwritten

Note on Java file names: a file that declares a `public` class must be named
after that class, so a numbered name such as `01_hello_world.java` cannot hold
`public class HelloWorld`. Every demo therefore keeps a package-private
(default-visibility) top-level class and is run with `java <ClassName>`.

Usage:
    python scripts/tools/normalize_java_demos.py --dry-run
    python scripts/tools/normalize_java_demos.py --apply
"""
import argparse
import hashlib
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
DEMO_DIR = REPO / "roadmap" / "java" / "demo"

# Lesson order: foundations -> control flow -> functions and OOP ->
# collections and streams -> exceptions. The number is the position in the
# demo page, not the position in the track.
RENAMES = [
    ("HelloWorld.java",        "01_hello_world.java"),
    ("NumericTypes.java",      "02_numeric_types.java"),
    ("CharType.java",          "03_char_boolean.java"),
    ("TypeCast.java",          "04_type_cast.java"),
    ("AutoBoxing.java",        "05_autoboxing.java"),
    ("PrintfDemo.java",        "06_printf_format.java"),
    ("Strings.java",           "07_string_format.java"),
    ("StringEquals.java",      "08_string_equals.java"),
    ("StringCompare.java",     "09_string_compare.java"),
    ("TextBlock.java",         "10_text_block.java"),
    ("PolindromInvertor.java", "11_palindrome.java"),
    ("ArraysTest.java",        "12_array_basics.java"),
    ("Matrix.java",            "13_matrix.java"),
    ("ArrayStreams.java",      "14_array_streams.java"),
    ("StringConcat.java",      "15_array_concat.java"),
    ("min-max.java",           "16_max_min_digit.java"),
    ("Decision.java",          "17_decision.java"),
    ("Ladder.java",            "18_ladder.java"),
    ("DoWhile.java",           "19_do_while.java"),
    ("Switch.java",            "20_switch_classic.java"),
    ("SwitchXP.java",          "21_switch_expression.java"),
    ("Labels.java",            "22_loop_labels.java"),
    ("PrimeNumbers.java",      "23_prime_numbers.java"),
    ("FunctionCall.java",      "24_function_call.java"),
    ("Overloaded.java",        "25_overloaded_methods.java"),
    ("RecursiveFun.java",      "26_recursion.java"),
    ("Varargs.java",           "27_varargs.java"),
    ("InputOutput.java",       "28_io_parameters.java"),
    ("Anonymous.java",         "31_anonymous_class.java"),
    ("Enumeration.java",       "32_enumeration.java"),
    ("RecordTest.java",        "33_record.java"),
    ("SealedClass.java",       "34_sealed_classes.java"),
    ("TypeInference.java",     "35_type_inference.java"),
    ("Test.java",              "36_package_visibility.java"),
    ("ArrayListClassic.java",  "37_array_list.java"),
    ("ArrayListTest.java",     "38_array_list_stream.java"),
    ("LinkedListTest.java",    "39_linked_list.java"),
    ("ForEach.java",           "40_for_each.java"),
    ("MapClass.java",          "41_hash_map.java"),
    ("SetClass.java",          "42_hash_set.java"),
    ("FilterTest.java",        "43_stream_filter.java"),
    ("RunnableTest.java",      "44_runnable_lambda.java"),
    ("StreamPara.java",        "45_parallel_stream.java"),
    ("Exceptions.java",        "46_exceptions.java"),
    ("ExceptionThrow.java",    "47_exception_throw.java"),
]

# (file, reason). Deleted only when the file is present; see the header.
DELETE = [
    ("CharType.class",       "compiled artifact, not a demo source"),
    ("HelloWorld.class",     "compiled artifact, not a demo source"),
    ("result.txt",           "program output captured by accident"),
    ("multithread.java",     "an HTML page saved with a .java extension"),
    ("executor.java",        "code fragment without a class declaration"),
    ("ForLoop.java",         "repeats the nested-loop prime algorithm of 23_prime_numbers.java"),
    ("Figure.java",          "byte-identical copy of 34_sealed_classes.java"),
    ("Account.java",         "merged into 29_account.java"),
    ("AccountDemo.java",     "merged into 29_account.java"),
    ("Animal.java",          "merged into 30_animal_polymorphism.java"),
    ("AnimalDemo.java",      "merged into 30_animal_polymorphism.java"),
]

# Files whose deletion requires a content check against a surviving file.
# The twin may still carry its old name when the check runs, so the mapping
# below resolves through RENAMES before giving up.
IDENTICAL_TO = {
    "Figure.java": "34_sealed_classes.java",
}

ORIGINAL_OF = {target: source for source, target in RENAMES}

# The demo page and the file headers both need the runnable class and a one
# line summary, so they are kept in one place: target file -> (class, summary).
CLASS_OF = {
    "01_hello_world.java":       ("HelloWorld",     "the smallest complete program: one class and the mandatory main method"),
    "02_numeric_types.java":     ("NumericTypes",   "the numeric primitive types, printed with format specifiers"),
    "03_char_boolean.java":      ("CharType",       "char and boolean, including a non-ASCII character"),
    "04_type_cast.java":         ("TypeCast",       "implicit widening and explicit narrowing casts"),
    "05_autoboxing.java":        ("AutoBoxing",     "automatic conversion between int and Integer"),
    "06_printf_format.java":     ("PrintfDemo",     "printf formatting with an argument index and a type specifier"),
    "07_string_format.java":     ("Strings",        "building output with System.out.format"),
    "08_string_equals.java":     ("StringEquals",   "equals() versus the == reference test"),
    "09_string_compare.java":    ("StringCompare",  "comparing several strings with equals()"),
    "10_text_block.java":        ("TextBlock",      "multi-line text blocks with a formatted() template"),
    "11_palindrome.java":        ("Palindrome",     "reverse a string through a char array"),
    "12_array_basics.java":      ("ArraysTest",     "declare, size, fill and read an array"),
    "13_matrix.java":            ("Matrix",         "a two-dimensional array walked with nested for-each loops"),
    "14_array_streams.java":     ("ArrayStreams",   "generate an array from an IntStream range"),
    "15_array_concat.java":      ("StringConcat",   "concatenate two int arrays into a new array"),
    "16_max_min_digit.java":     ("MaxMinDigit",    "split an integer into digits and find the extremes"),
    "17_decision.java":          ("Decision",       "the if/else statement"),
    "18_ladder.java":            ("Ladder",         "an if/else-if ladder with several branches"),
    "19_do_while.java":          ("DoWhile",        "the do/while loop, which runs its body at least once"),
    "20_switch_classic.java":    ("Switch",         "the classic switch statement, including fall-through"),
    "21_switch_expression.java": ("SwitchXP",       "the switch expression with arrow labels"),
    "22_loop_labels.java":       ("Labels",         "break and continue with a labelled outer loop"),
    "23_prime_numbers.java":     ("PrimeNumbers",   "nested loops with a pre-seeded break"),
    "24_function_call.java":     ("FunctionCall",   "declare a method and call it from main"),
    "25_overloaded_methods.java":("Overloaded",     "method overloading resolved by the compiler"),
    "26_recursion.java":         ("RecursiveFun",   "recursion with a base case"),
    "27_varargs.java":           ("Varargs",        "variable arity parameters"),
    "28_io_parameters.java":     ("InputOutput",    "reference semantics: an array element as an output parameter"),
    "29_account.java":           ("Account",        "a class with a constructor and private state"),
    "30_animal_polymorphism.java":("AnimalDemo",    "abstract class, inheritance and polymorphism"),
    "31_anonymous_class.java":   ("AnonymousDemo",  "an anonymous implementation of an interface"),
    "32_enumeration.java":       ("Enumeration",    "an enum type compared with =="),
    "33_record.java":            ("RecordTest",     "records with a compact constructor"),
    "34_sealed_classes.java":    ("Figure",         "sealed classes and the permitted hierarchy"),
    "35_type_inference.java":    ("TypeInference",  "local variable type inference with var"),
    "36_package_visibility.java":("VisibilityDemo", "the four access levels"),
    "37_array_list.java":        ("ArrayListClassic","ArrayList walked with an explicit Iterator"),
    "38_array_list_stream.java": ("ArrayListTest",  "ArrayList filled and printed with a stream"),
    "39_linked_list.java":       ("LinkedListTest", "LinkedList walked with an explicit Iterator"),
    "40_for_each.java":          ("ForEach",        "the forEach terminal operation"),
    "41_hash_map.java":          ("MapClass",       "HashMap key/value pairs"),
    "42_hash_set.java":          ("SetClass",       "HashSet: duplicates are dropped"),
    "43_stream_filter.java":     ("FilterTest",     "a stream pipeline with filter and a method reference"),
    "44_runnable_lambda.java":   ("RunnableTest",   "an anonymous class versus a lambda for a Runnable"),
    "45_parallel_stream.java":   ("StreamPara",     "a parallel stream spread over the common pool"),
    "46_exceptions.java":        ("Exceptions",     "catching an ArithmeticException"),
    "47_exception_throw.java":   ("ExceptionThrow", "throwing a checked exception"),
}

HEADER = "/* Java lab demo"


def digest(path: Path) -> str:
    """Content fingerprint, whitespace-insensitive."""
    text = path.read_text(encoding="utf-8", errors="replace")
    return hashlib.sha256(" ".join(text.split()).encode("utf-8")).hexdigest()


# A top-level type declaration at column 0 may carry `public`, which Java
# forbids unless the file is named after the type. Indented (nested) types are
# left alone because the pattern is anchored at the start of the line.
PUBLIC_TYPE = re.compile(
    r"^public\s+(?=(?:(?:final|abstract|sealed|non-sealed|static|strictfp)\s+)*"
    r"(?:class|interface|enum|record)\b)",
    re.MULTILINE,
)


def rewrite(path: Path, main_class: str, summary: str) -> list:
    """Plan the contract fix-ups for one demo file.

    Returns a list of human-readable change descriptions; the caller writes the
    new text back only when --apply was given.
    """
    text = path.read_text(encoding="utf-8")
    changes = []

    stripped, count = PUBLIC_TYPE.subn("", text)
    if count:
        changes.append(f"drop `public` on {count} top-level type(s)")
        text = stripped

    if not text.startswith(HEADER):
        number, _, name = path.stem.partition("_")
        header = (f"/* Java lab demo {number} — {summary}.\n"
                  f" *\n"
                  f" * Run:  javac {path.name}  &&  java {main_class}\n"
                  f" */\n")
        text = header + text
        changes.append("add run header")

    return changes, text


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--dry-run", action="store_true", help="print the plan, change nothing")
    group.add_argument("--apply", action="store_true", help="perform the renames and deletions")
    args = parser.parse_args()

    if not DEMO_DIR.is_dir():
        print(f"ERROR: {DEMO_DIR} does not exist", file=sys.stderr)
        return 1

    problems = 0
    planned = []

    for source, target in RENAMES:
        src = DEMO_DIR / source
        dst = DEMO_DIR / target
        if not src.exists():
            if dst.exists():                     # already renamed: idempotent
                print(f"[SKIP] {source:22s} -> {target} (already numbered)")
                continue
            print(f"[FAIL] missing source: {source}", file=sys.stderr)
            problems += 1
            continue
        if dst.exists():
            print(f"[FAIL] target already exists: {target}", file=sys.stderr)
            problems += 1
            continue
        planned.append((src, dst))
        print(f"[PLAN] {source:22s} -> {target}")

    for name, reason in DELETE:
        path = DEMO_DIR / name
        if not path.exists():
            print(f"[SKIP] {name} (already removed)")
            continue
        twin = IDENTICAL_TO.get(name)
        if twin:
            other = DEMO_DIR / twin
            if not other.exists():
                other = DEMO_DIR / ORIGINAL_OF.get(twin, twin)
            if not other.exists() or digest(path) != digest(other):
                print(f"[WARN] {name} is not identical to {twin}: not deleting",
                      file=sys.stderr)
                continue
        print(f"[PLAN] DELETE {name:22s} ({reason})")
        planned.append((path, None))

    # Stage two — contract fix-ups on the numbered files (idempotent: a file
    # that already carries the header and no `public` top-level type is skipped).
    edits = []
    for target in sorted(CLASS_OF):
        path = DEMO_DIR / target
        if not path.exists():
            continue
        main_class, summary = CLASS_OF[target]
        changes, text = rewrite(path, main_class, summary)
        if changes:
            print(f"[PLAN] {target:28s} {', '.join(changes)}")
            edits.append((path, text))

    print(f"\n{len(planned)} file change(s) and {len(edits)} content fix-up(s) planned, "
          f"{problems} problem(s)")

    if args.dry_run or problems:
        if problems:
            return 1
        print("dry run: nothing written")
        return 0

    for src, dst in planned:
        if dst is None:
            src.unlink()
        else:
            src.rename(dst)
    for path, text in edits:
        path.write_text(text, encoding="utf-8")
    print(f"applied {len(planned)} file change(s) and {len(edits)} content fix-up(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
