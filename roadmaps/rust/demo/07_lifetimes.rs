// 07_lifetimes.rs — explicit lifetime annotations.
// Run:  rustc 07_lifetimes.rs && ./07_lifetimes
fn main() {
    let first = String::from("short");
    let second = String::from("much longer");

    // The returned reference borrows from both inputs (lifetime 'a).
    let result = longest(&first, &second);
    println!("longest = {result}");
}

// 'a says: the output reference lives at most as long as the shorter input.
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() >= y.len() { x } else { y }
}
