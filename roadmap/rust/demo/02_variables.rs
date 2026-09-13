// 02_variables.rs — variables, mutability, and shadowing.
// Run:  rustc 02_variables.rs && ./02_variables
fn main() {
    // Bindings are immutable by default.
    let x = 5;
    // x = 6;                      // ERROR: cannot assign to immutable `x`

    // Mark a binding `mut` to change it later.
    let mut y = 10;
    y += 1;
    println!("x = {x}, y = {y}");

    // Shadowing reuses a name and can even change its type.
    let value = "a string";
    let value = value.len();       // shadowed as a usize
    println!("value = {value}");
}
