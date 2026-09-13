// 12_loops.rs — loop, while, and for.
// Run:  rustc 12_loops.rs && ./12_loops
fn main() {
    // loop runs forever until break; it can also return a value.
    let mut count = 0;
    let result = loop {
        count += 1;
        if count == 3 {
            break count * 10;   // break with a value
        }
    };
    println!("loop result = {result}");

    // while loops over a condition.
    let mut n = 3;
    while n > 0 {
        print!("{n} ");
        n -= 1;
    }
    println!();

    // for iterates over a range or collection.
    for i in 1..=5 {
        print!("{i} ");
    }
    println!();
}
