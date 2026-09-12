// 01 — Hello, Swift — run with: swift 01_hello.swift
//
// A Swift file is a program from its first line: there is no required main
// function and no class wrapper. Statements written at the top level of the
// file execute from top to bottom, which makes one file a complete experiment.

// print(_:) writes to standard output and appends a newline.
print("Hello, Swift!")

// String interpolation embeds an expression inside \( ). The expression is
// evaluated first and then converted to text — no format specifiers, and no
// risk of the argument type not matching the placeholder.
let language = "Swift"
let year = 2014
print("\(language) appeared in \(year).")

// let declares a constant: assign once, never again. Swift nudges you toward
// let by default and reserves var for state that really changes, because a
// value that cannot change is a value that cannot break.
let author = "Chris Lattner"

// var declares a variable. Its type is inferred from the first assignment and
// then fixed: Swift never silently converts between number types for you.
var version = 5
version = version + 2
print("\(author) shipped \(language) \(version) as a compiled language.")

// Because types are not mixed implicitly, the next line would not compile:
// "binary operator '+' cannot be applied to operands of type 'String' and 'Int'".
// print("Version " + version)
print("Version " + String(version))   // converting explicitly is the fix

// Multi-line text uses triple quotes. Indentation is measured against the
// closing delimiter, so the output is flush left even though the source is not.
let banner = """
    Sage-Code
    Swift roadmap
    """
print(banner)

// A single file can also declare real types; they are visible to the code
// above and below them, so order inside the file does not matter for types.
struct Greeting {
    let text: String
    func shout() -> String { text.uppercased() }
}
print(Greeting(text: "welcome").shout())
