// 19_threads.rs — std::thread and channels.
// Run:  rustc 19_threads.rs && ./19_threads
// NOTE: real async/await (the async.html lesson) needs a runtime like tokio;
// this std-only demo shows the underlying concurrency with threads.
use std::thread;
use std::time::Duration;
use std::sync::mpsc;

fn main() {
    // Spawn a thread that does work and sends a message back.
    let (tx, rx) = mpsc::channel();

    let handle = thread::spawn(move || {
        thread::sleep(Duration::from_millis(80));
        tx.send("done working").unwrap();
    });

    // The main thread keeps doing its own thing.
    println!("main is free");

    // Block until the worker reports in.
    if let Ok(msg) = rx.recv() {
        println!("worker sent: {msg}");
    }
    handle.join().unwrap();
}
