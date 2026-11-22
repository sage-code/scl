// 05_ownership.rs — move semantics and Copy types.
// Run:  rustc 05_ownership.rs && ./05_ownership
fn main() {
    // String is an owned type: assignment moves the value.
    let s1 = String::from("hello");
    let s2 = s1;
    // println!("{s1}");          // ERROR: s1 was moved
    println!("s2 = {s2}");

    // i32 is Copy: assignment copies, both remain valid.
    let a = 5;
    let b = a;
    println!("a = {a}, b = {b}");

    // Passing a String to a function moves it in.
    let data = String::from("moved in");
    take_ownership(data);
    // println!("{data}");        // ERROR: value was moved
}

fn take_ownership(text: String) {
    println!("received: {text}");
} // `text` drops here and frees its memory
