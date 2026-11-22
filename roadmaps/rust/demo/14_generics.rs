// 14_generics.rs — one function or type works for many types.
// Run:  rustc 14_generics.rs && ./14_generics
fn main() {
    println!("largest int = {}", largest(&[3, 7, 2]));
    println!("largest float = {}", largest(&[1.5, 9.2, 4.1]));

    let pair = Pair::new(1, "one");
    println!("pair = {:?}", pair);   // tuple-style layout

    let _pt = Point { x: 1.0, y: 2.0 };
    println!("point.x = {}", _pt.x);
}

// A generic function: T is any type that supports comparison.
fn largest<T: PartialOrd + Copy>(items: &[T]) -> T {
    let mut best = items[0];
    for &it in items {
        if it > best {
            best = it;
        }
    }
    best
}

// A generic struct with two independent type parameters.
#[derive(Debug)]
struct Pair<A, B>(A, B);

impl<A, B> Pair<A, B> {
    fn new(a: A, b: B) -> Self {
        Pair(a, b)
    }
}

struct Point<T> {
    x: T,
    y: T,
}
