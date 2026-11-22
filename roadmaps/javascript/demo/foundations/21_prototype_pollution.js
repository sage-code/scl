// 21_prototype_pollution.js — a contraexample lab: how one line breaks EVERY object.
// Run:   node 21_prototype_pollution.js

// THE ATTACK — assignment to __proto__ writes into the shared ancestor.
const victim = {};
victim.__proto__.isAdmin = true;      // this mutates Object.prototype itself!
console.log(({}).isAdmin);            // true — a BRAND-NEW object already has it
console.log("isAdmin" in {});         // true — `in` walks the whole chain

// Consequence: loops over "own" keys inherit the pollution.
for (const key in {}) console.log("for..in now yields:", key);
// -> for..in now yields: isAdmin   ({} has no own keys at all!)

// DEFENSE 1 — prototype-free dictionaries for untrusted keys:
const safeDict = Object.create(null); // NO prototype at all
safeDict.isAdmin = true;              // own property only
console.log(Object.keys(safeDict));   // [ 'isAdmin' ] — cannot pollute a chain

// DEFENSE 2 — validate keys in merges; copy own keys only:
function safeMerge(target, source) {
  for (const key of Object.keys(source)) {          // own, enumerable keys
    if (key === "__proto__" || key === "constructor") continue; // reject danger keys
    target[key] = source[key];
  }
  return target;
}
const merged = safeMerge({}, { theme: "dark", __proto__: { hacked: 1 } });
console.log(merged.theme, Object.hasOwn(merged, "hacked")); // dark false

// DEFENSE 3 — in real code: Map for untrusted dictionaries (no prototype at all).

// Expected output:
//   true
//   true
//   for..in now yields: isAdmin
//   [ 'isAdmin' ]
//   dark false
