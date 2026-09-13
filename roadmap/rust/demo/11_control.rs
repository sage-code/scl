// 11_control.rs — if/else and match expressions.
// Run:  rustc 11_control.rs && ./11_control
fn main() {
    let n = 42;

    // if is an expression, so it can bind a value.
    let kind = if n > 0 { "positive" } else { "non-positive" };
    println!("{n} is {kind}");

    // match is exhaustive pattern matching.
    let five = 5;
    let word = match five {
        0 => "zero",
        1 => "one",
        2..=9 => "small",
        _ => "large",
    };
    println!("five is {word}");
}
