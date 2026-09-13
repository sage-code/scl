// 16_iterators.rs — lazy transformations with map/filter/collect.
// Run:  rustc 16_iterators.rs && ./16_iterators
fn main() {
    let numbers = 1..=10;

    // Nothing runs until consume: sum() drives the whole chain.
    let total: i32 = numbers
        .filter(|n| n % 2 == 0)   // keep even numbers
        .map(|n| n * n)           // square them
        .sum();                   // consume

    println!("sum of even squares = {total}");

    // collect materializes an iterator into a collection.
    let names = ["ada", "alan", "grace", "donald"];
    let upper: Vec<String> = names.iter()
        .filter(|n| n.len() > 3)
        .map(|n| n.to_uppercase())
        .collect();
    println!("{upper:?}");
}
