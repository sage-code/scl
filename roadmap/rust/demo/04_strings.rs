// 04_strings.rs — &str versus String, and formatting.
// Run:  rustc 04_strings.rs && ./04_strings
fn main() {
    // &str: a borrowed view over static text.
    let literal: &str = "hello";

    // String: an owned, growable buffer on the heap.
    let mut owned = String::from(literal);
    owned.push_str(", Rust");
    owned.push('!');

    // format! builds a new String from a template.
    let greeting = format!("{} world", "Hello");

    // len() counts bytes; chars() iterates Unicode scalar values.
    println!("{greeting}");
    println!("{owned} — bytes = {}, chars = {}", owned.len(), owned.chars().count());
}
