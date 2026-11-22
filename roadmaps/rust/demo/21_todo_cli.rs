// Study project 1 — a tiny command-line TODO list.
// Compose a struct, a Vec, and std::env::args to store and list tasks.
// Run:  rustc todo_cli.rs && ./todo_cli add "learn rust"; ./todo_cli list
use std::env;

struct Todo {
    items: Vec<String>,
}

impl Todo {
    fn new() -> Self {
        Todo { items: Vec::new() }
    }

    fn add(&mut self, text: &str) {
        self.items.push(text.to_string());
    }

    fn list(&self) {
        if self.items.is_empty() {
            println!("(no tasks)");
            return;
        }
        for (i, item) in self.items.iter().enumerate() {
            println!("{}. {item}", i + 1);
        }
    }
}

fn main() {
    let mut todo = Todo::new();
    let args: Vec<String> = env::args().collect();

    match args.get(1).map(String::as_str) {
        Some("add") => {
            if let Some(text) = args.get(2) {
                todo.add(text);
            }
            todo.list();
        }
        Some("list") | None => todo.list(),
        _ => println!("usage: todo_cli [add <text> | list]"),
    }
}
