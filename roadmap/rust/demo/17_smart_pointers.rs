// 17_smart_pointers.rs — Box, Rc, and RefCell.
// Run:  rustc 17_smart_pointers.rs && ./17_smart_pointers
use std::cell::RefCell;
use std::rc::Rc;

fn main() {
    // Box: own a value on the heap.
    let b = Box::new(5);
    println!("boxed = {b}");

    // Rc: shared ownership with a reference count.
    let shared = Rc::new(String::from("shared data"));
    let clone = Rc::clone(&shared);
    println!("owners = {}, value = {shared}", Rc::strong_count(&shared));

    // RefCell: mutate through a shared reference (checked at runtime).
    let counter = Rc::new(RefCell::new(0));
    *counter.borrow_mut() += 1;
    *counter.borrow_mut() += 1;
    println!("count = {}", counter.borrow());

    // silence "unused" — clone is actually used above indirectly
    let _ = clone;
}
