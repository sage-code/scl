// Study project 3 — mini-grep: search a file for lines containing a query.
// Run:  rustc mini_grep.rs && ./mini_grep query mini_grep.rs
use std::env;
use std::fs;

fn main() {
    // Collect arguments: [0]=program, [1]=query, [2]=file path.
    let args: Vec<String> = env::args().collect();
    if args.len() < 3 {
        eprintln!("usage: mini_grep <query> <file>");
        std::process::exit(1);
    }
    let query = &args[1];
    let path = &args[2];

    // Read the whole file; propagate a read error as a clean message.
    let content = fs::read_to_string(path)
        .unwrap_or_else(|e| {
            eprintln!("could not read {path}: {e}");
            std::process::exit(1);
        });

    // Print every line that contains the query (case-sensitive).
    for (i, line) in content.lines().enumerate() {
        if line.contains(query) {
            println!("{}: {line}", i + 1);
        }
    }
}
