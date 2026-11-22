// 20_testing.rs — unit tests with #[test] and assertions.
// Compile with tests enabled:  rustc --test 20_testing.rs -o 20_testing && ./20_testing
fn main() {
    // Run with --test to execute the tests below as well.
    println!("{} + {} = {}", 2, 3, add(2, 3));
}

pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn adds_two_numbers() {
        assert_eq!(add(2, 3), 5);
    }

    #[test]
    fn identity() {
        assert_eq!(add(0, 7), 7);
    }

    #[test]
    #[should_panic(expected = "attempt")]
    fn panics_as_expected() {
        let n = 1i32 / 0;   // deliberately panics
        let _ = n;
    }
}
