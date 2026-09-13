// 09_closures.rs — anonymous functions that capture their environment.
// Run:  rustc 09_closures.rs && ./09_closures
fn main() {
    let factor = 10;

    // Closure captures `factor` by reference.
    let scale = |n: i32| n * factor;

    let numbers = vec![1, 2, 3, 4];
    let scaled: Vec<i32> = numbers.iter().map(|&n| scale(n)).collect();

    println!("scaled = {scaled:?}");

    // A FnMut closure captures by mutable reference.
    let mut total = 0;
    let mut add_to_total = |n: i32| total += n;
    for n in numbers {
        add_to_total(n);
    }
    println!("total = {total}");
}
