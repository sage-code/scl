// 06_borrowing.rs — shared (`&T`) and exclusive (`&mut T`) borrows.
// Run:  rustc 06_borrowing.rs && ./06_borrowing
fn main() {
    let mut s = String::from("hello");

    // Shared borrows: many readers may coexist.
    let len = len_of(&s);
    println!("length = {len}");

    // Exclusive borrow: one writer, no other borrows alive.
    append_exclamation(&mut s);
    println!("s = {s}");
}

fn len_of(value: &String) -> usize {
    value.len()
}

fn append_exclamation(value: &mut String) {
    value.push('!');
}
