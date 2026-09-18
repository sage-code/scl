/**
 * 27_event_loop_lab.js — the execution-order model, made runnable.
 *
 * Run with: node 27_event_loop_lab.js
 * One thread, one call stack, two queues. Predict every block BEFORE running,
 * then verify. The rules:
 *   1. synchronous code runs to completion first
 *   2. microtasks (promise callbacks) drain completely after each task
 *   3. macrotasks (timers, I/O) run one per turn, AFTER the microtask queue
 */

// --- Part 1: setTimeout(…, 0) still waits for the current task ---------------
console.log("1: script start");          // synchronous: runs first, always
setTimeout(() => console.log("4: timeout"), 0); // queued as a MACROtask
console.log("2: script end");            // synchronous: still the same task

// Expected order so far:
// 1: script start
// 2: script end
// (the timeout callback cannot run until THIS script finishes)

// --- Part 2: microtasks jump the timer queue ---------------------------------
Promise.resolve().then(() => console.log("3: microtask (promise)"));
// Even though the timer was registered ABOVE, the microtask drains first:
// 3: microtask (promise)
// 4: timeout

// --- Part 3: the full ordering quiz ------------------------------------------
setTimeout(() => {
  console.log("T: timer");
  Promise.resolve().then(() => console.log("T-micro: timer's own microtask"));
}, 0);

Promise.resolve()
  .then(() => console.log("P1: first microtask"))
  .then(() => console.log("P2: chained microtask — runs next turn of the drain"));

console.log("S: sync end");

// Expected order:
// S: sync end          ← the current task finishes (parts 1–2 logged before this)
// P1: first microtask
// P2: chained microtask — chained .then runs in the SAME drain
// T: timer             ← a NEW task; the drain must be empty first
// T-micro: timer's own microtask ← drained after every task, not just script tasks

// --- Part 4: starvation — one blocking loop freezes the world ----------------
// Nothing here is "wrong"; this is what blocking the single thread costs.
const start = Date.now();
setTimeout(() => {
  const lag = Date.now() - start;
  console.log(`timer fired ${lag}ms late (requested 100) — the sync loop held the thread`);
}, 100);

let sink = 0;
while (Date.now() - start < 300) sink++; // block the ONLY thread for 300ms

// Expected output (roughly):
// timer fired 302ms late (requested 100) — the sync loop held the thread
