// 13_errors.rs — Option, Result, and the `?` operator.
// Run:  rustc 13_errors.rs && ./13_errors
fn main() {
    // Option: a value that may be absent.
    let maybe = find(2, &[10, 20, 30]);
    match maybe {
        Some(v) => println!("found = {v}"),
        None => println!("not found"),
    }

    // Result: a value or an error; `?` propagates errors to main.
    match parse_then_double("21") {
        Ok(v) => println!("doubled = {v}"),
        Err(e) => println!("error: {e}"),
    }
}

fn find(target: i32, items: &[i32]) -> Option<i32> {
    for &it in items {
        if it == target {
            return Some(it);
        }
    }
    None
}

fn parse_then_double(input: &str) -> Result<i32, std::num::ParseIntError> {
    let n = input.parse::<i32>()?;      // `?` unwraps Ok or returns Err early
    Ok(n * 2)
}
