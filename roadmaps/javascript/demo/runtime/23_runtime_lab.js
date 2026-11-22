/**
 * 23_runtime_lab.js — the call stack, stack overflow, and a visible memory leak.
 *
 * Run with: node 23_runtime_lab.js
 * The engine's stack and heap are usually invisible; this demo makes each one
 * observable from JavaScript itself.
 */

// --- Part 1: watching the call stack build and unwind ------------------------
// Each nested call adds a frame; each return removes one. The depth counter makes
// the normally invisible stack visible.

function descend(depth) {
  if (depth === 0) return "bottom";
  // Comment out the `if` above later: what do you expect to happen?
  const fromBelow = descend(depth - 1); // frame for THIS call stays alive while we wait
  return depth === 1 ? `depth 1 → ${fromBelow}` : fromBelow;
}

console.log(descend(3));
// Expected output: depth 1 → bottom

// --- Part 2: stack overflow — the stack has a hard limit ---------------------
// Recursion without a working base case grows the stack until the engine refuses.
// The error is a RangeError with a message every developer eventually meets.

function runaway(n) {
  return runaway(n + 1); // no base case — every frame waits on the next one
}

try {
  runaway(0);
} catch (error) {
  console.log(`caught: ${error.name}: ${error.message.slice(0, 40)}`);
}
// Expected output (message text varies slightly by engine):
// caught: RangeError: Maximum call stack size exceeded

// --- Part 3: stack vs heap — primitives copy, objects share ------------------
// Primitive values live in the frame (copied on assignment); objects live in the
// heap (only the reference is copied, so both names point at ONE object).

let stackNumber = 42;
let copy = stackNumber; // value copied — two independent numbers
copy = 100;
console.log(stackNumber, copy); // 42 100

const heapObject = { value: 42 };
const alias = heapObject;       // reference copied — still ONE object in the heap
alias.value = 100;
console.log(heapObject.value, alias.value); // 100 100

// Expected output:
// 42 100
// 100 100

// --- Part 4: a leak you can measure ------------------------------------------
// Garbage collection frees only UNREACHABLE objects. A cache that grows without
// bound keeps every entry reachable — memory climbs and never comes back.

const leakyCache = [];
const before = process.memoryUsage().heapUsed;

for (let i = 0; i < 500_000; i++) {
  leakyCache.push({ index: i, payload: "x".repeat(100) }); // every entry stays reachable
}

const after = process.memoryUsage().heapUsed;
console.log(`heap grew by ~${Math.round((after - before) / 1024 / 1024)} MB`);
// heap grew by ~129 MB — the exact number varies by engine and machine; that it
// never comes back is the point.

// The fix is not "clean up harder" — it is bound the data: cap the size (LRU),
// or use a WeakMap keyed on short-lived objects so entries become unreachable
// when their keys die.
