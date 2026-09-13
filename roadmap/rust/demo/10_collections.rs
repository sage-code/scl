// 10_collections.rs — Vec, HashMap, and HashSet.
// Run:  rustc 10_collections.rs && ./10_collections
use std::collections::{HashMap, HashSet};

fn main() {
    // Vec: a growable array.
    let mut vec = vec![1, 2, 3];
    vec.push(4);
    println!("vec = {vec:?}");

    // HashMap: key -> value.
    let mut scores = HashMap::new();
    scores.insert("blue", 10);
    scores.insert("red", 50);
    if let Some(v) = scores.get("blue") {
        println!("blue team score = {v}");
    }

    // HashSet: unique values.
    let mut seen = HashSet::new();
    seen.insert(1);
    seen.insert(2);
    seen.insert(2); // duplicate, ignored
    println!("unique = {seen:?}");
}
