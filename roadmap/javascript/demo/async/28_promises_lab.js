/**
 * 28_promises_lab.js — promise states, chaining, combinators, and two traps.
 *
 * Run with: node 28_promises_lab.js
 * A promise is a handle for ONE future value, with exactly three states:
 * pending → fulfilled (has a value) | rejected (has an error). Settlement is final.
 */

// --- Part 1: states and settlement are final ---------------------------------
const settled = new Promise((resolve) => {
  resolve("first");
  resolve("second"); // ignored — the FIRST resolve wins, later calls are no-ops
});
settled.then((value) => console.log("settled with:", value));
// Expected output:
// settled with: first

// --- Part 2: chaining — each .then transforms the value ----------------------
fetchLike(2)
  .then((n) => n * 10)        // return a value → next .then receives it
  .then((n) => fetchLike(n))  // return a PROMISE → the chain waits for it
  .then((n) => console.log("chain result:", n))
  .catch((error) => console.log("caught anywhere in the chain:", error.message));

function fetchLike(n) {
  // A minimal async simulation: resolve after a tick.
  return new Promise((resolve) => setTimeout(() => resolve(n + 1), 10));
}

// Expected output:
// chain result: 31   (fetchLike(2)=3 → 3*10=30 → fetchLike(30)=31)

// --- Part 3: errors propagate down the chain until a catch ------------------
new Promise((_, reject) => reject(new Error("boom")))
  .then((v) => console.log("skipped:", v))       // rejection SKIPS then handlers
  .then((v) => console.log("skipped too:", v))
  .catch((error) => console.log("one catch covers the whole chain:", error.message))
  .then(() => console.log("catch returns a normal promise — the chain continues"));
// Expected output:
// one catch covers the whole chain: boom
// catch returns a normal promise — the chain continues

// --- Part 4: the four combinators on one line each ---------------------------
const tasks = [fetchLike(1), fetchLike(2), Promise.reject(new Error("one failed"))];

const safeTasks = tasks.map((p) => p.catch((e) => `(${e.message})`)); // isolate failures

Promise.all(safeTasks)       // all must fulfill (we made that true)
  .then((values) => console.log("all:", values));
Promise.allSettled(tasks)    // never rejects; reports every outcome
  .then((results) => console.log("allSettled:", results.map((r) => r.status).join(", ")));
Promise.any(tasks.map((p) => p.catch(() => Promise.reject(p)))) // first FULFILLED wins
  .then((v) => console.log("any fulfilled first:", v))
  .catch(() => console.log("any: every input failed"));
Promise.race(tasks)          // first SETTLED wins — even a rejection
  .catch((e) => console.log("race: first settlement was a rejection:", e.message));

// Expected output (order varies — timing decides):
// all: [ '2', '3', '(one failed)' ]  → note strings: our catch returned strings
// allSettled: rejected, fulfilled, fulfilled   (or similar — 10ms timers race)
// race: first settlement was a rejection: one failed

// --- Part 5: TRAP — the floating promise -------------------------------------
// Since Node 15, an unhandled rejection CRASHES the process — exactly like an
// uncaught synchronous error. We register a handler to see it reported instead:
process.on("unhandledRejection", (reason) => {
  console.log("unhandledRejection reached the process level:", reason.message);
  process.exitCode = 0; // keep the demo exit clean; a real app should fail loudly
});

function saveSettings() {
  // Bug: no return. The caller gets undefined and CANNOT await or catch this.
  fetchLike(9).then((v) => { throw new Error("explodes with nobody listening"); });
}

async function main() {
  const result = saveSettings(); // undefined — the promise floated away
  console.log("saveSettings returned:", result);
  await new Promise((r) => setTimeout(r, 50)); // give the lost error time to surface
}
main().catch((e) => console.log("main caught:", e.message)); // …it never does: nobody awaits saveSettings()
// Expected output:
// saveSettings returned: undefined
// unhandledRejection reached the process level: explodes with nobody listening
// FIX: `return fetchLike(9).then(...)` — or make saveSettings async and await inside.
