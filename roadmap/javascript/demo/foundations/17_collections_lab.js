// 17_collections_lab.js — Map, Set, WeakMap, and the iteration protocol.
// Run:   node 17_collections_lab.js

// MAP: keys of ANY type, real size, insertion order, no inherited-key traps.
const sessionLengths = new Map();
const session1 = { id: 1 };       // an OBJECT as key — impossible with a plain object
sessionLengths.set(session1, 420);
sessionLengths.set(" lobby", 90);
console.log(sessionLengths.size);           // 2
console.log(sessionLengths.get(session1));  // 420
for (const [key, seconds] of sessionLengths) console.log(key, seconds);

// SET: unique values — the one-line dedup.
const tags = ["js", "web", "js", "async", "web"];
console.log([...new Set(tags)]);            // [ 'js', 'web', 'async' ]
console.log(new Set(tags).has("async"));    // true — O(1) lookup

// WEAKMAP: keys held WEAKLY — entries vanish when the key object is GC'd.
const metadata = new WeakMap();
const domNode = { tagName: "section" };
metadata.set(domNode, { visits: 3 }); // invisible side-data, no leak risk
console.log(metadata.has(domNode));   // true
// No .size, no iteration — BY DESIGN: you cannot touch entries whose key died.

// THE ITERATION PROTOCOL: anything with [Symbol.iterator] works in for...of.
const range = {
  from: 1, to: 3,
  [Symbol.iterator]() {              // must return an iterator object
    let current = this.from;
    return {
      next: () => ({
        value: current,
        done: current++ > this.to,   // done AFTER `to` is produced
      }),
    };
  },
};
for (const n of range) console.log("range:", n); // 1, 2, 3 — custom iterable!

// Expected output:
//   2
//   420
//   { id: 1 } 420
//    lobby 90
//   [ 'js', 'web', 'async' ]
//   true
//   true
//   range: 1
//   range: 2
//   range: 3
