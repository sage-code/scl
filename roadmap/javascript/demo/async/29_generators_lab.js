/**
 * 29_generators_lab.js — iterator protocol, yield, delegation, lazy pipelines.
 *
 * Run with: node 29_generators_lab.js
 * A generator function returns an object that PAUSES at each yield and resumes
 * on demand. Values are produced lazily: nothing runs until you ask.
 */

// --- Part 1: the iterator protocol by hand -----------------------------------
// for…of works on anything with a Symbol.iterator returning { next() → {value, done} }.
const handMade = {
  upTo: 3,
  [Symbol.iterator]() {
    let i = 1;
    return { next: () => (i <= this.upTo ? { value: i++, done: false } : { value: undefined, done: true }) };
  },
};
console.log("hand-made iterable:", [...handMade].join(", "));
// Expected output:
// hand-made iterable: 1, 2, 3

// --- Part 2: generators — the protocol, written for you ----------------------
function* fibonacci() {
  let [a, b] = [0, 1];
  while (true) {          // INFINITE — and safe, because nothing runs until asked
    yield a;
    [a, b] = [b, a + b];
  }
}

const fib = fibonacci();
console.log("first four:", fib.next().value, fib.next().value, fib.next().value, fib.next().value);
// Expected output:
// first four: 0 1 1 2

// --- Part 3: lazy pipelines — take(n) caps an infinite sequence --------------
function* take(iterable, n) {
  let count = 0;
  for (const value of iterable) {
    if (count++ >= n) return;   // stop pulling: the generator freezes at its yield
    yield value;
  }
}

console.log("fib take 8:", [...take(fibonacci(), 8)].join(", "));
// Expected output:
// fib take 8: 0, 1, 1, 2, 3, 5, 8, 13

// --- Part 4: yield* — delegation between generators --------------------------
function* tree(node) {
  if (typeof node !== "object" || node === null) {
    yield node;                 // a leaf: produce its value
    return;
  }
  for (const child of Object.values(node)) {
    yield* tree(child);         // delegate: the child's yields flow through ours
  }
}

const doc = { id: "root", children: [{ id: "a" }, { id: "b", children: [{ id: "ba" }] }] };
console.log("leaves:", [...tree(doc)].join(", "));
// Expected output:
// leaves: root, a, b, ba   (all string leaf values, depth first)

// --- Part 5: async iteration — for await…of ---------------------------------
// An async generator produces PROMISES; for await…of awaits each one in order.
async function* ticks(count) {
  for (let i = 1; i <= count; i++) {
    await new Promise((r) => setTimeout(r, 10)); // simulated async event source
    yield `tick ${i}`;
  }
}

(async () => {
  for await (const message of ticks(3)) {
    console.log(message);
  }
  console.log("stream done");
})();
// Expected output (one per 10ms):
// tick 1
// tick 2
// tick 3
// stream done
