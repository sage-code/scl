// 08_functions.rs — functions, parameters, and return values.
// Run:  rustc 08_functions.rs && ./08_functions
fn main() {
    let total = add(10, 32);
    let (q, r) = divide(20, 6);   // returning a tuple
    println!("sum = {total}, quotient = {q}, remainder = {r}");
}

// The last expression (no semicolon) is the return value.
fn add(a: i32, b: i32) -> i32 {
    a + b
}

fn divide(a: i32, b: i32) -> (i32, i32) {
    (a / b, a % b)
}
