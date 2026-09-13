// Study project 2 — word frequency counter using a HashMap.
// Run:  rustc wordcount.rs && echo "the rust book the rust" | ./wordcount
use std::collections::HashMap;
use std::io::{self, Read};

fn main() {
    // Read all of stdin into one String.
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).unwrap();

    // Map each word to its count.
    let mut counts: HashMap<&str, u32> = HashMap::new();
    for word in input.split_whitespace() {
        // entry().or_insert() updates or inserts in one pass.
        *counts.entry(word).or_insert(0) += 1;
    }

    // Sort by count descending, then print.
    let mut pairs: Vec<_> = counts.into_iter().collect();
    pairs.sort_by(|a, b| b.1.cmp(&a.1));
    for (word, count) in pairs {
        println!("{count:4}  {word}");
    }
}
