// 19_this_binding.js — the four rules, demonstrated where they run.
// Run:   node 19_this_binding.js
"use strict"; // Node modules are strict by default; be explicit in scripts.

// RULE 1 — method call: this = the object before the dot.
const counter = {
  value: 10,
  show() { return `this.value is ${this.value}`; },
};
console.log(counter.show()); // this.value is 10

// THE TRAP: extract the method, and the call site changes.
const extracted = counter.show;
// console.log(extracted()); // TypeError: Cannot read properties of undefined

// RULE 2 — plain call (strict): this = undefined. Inside a non-arrow function
// that "lost" its object, this is no longer the counter — the source of the
// infamous "Cannot read properties of undefined" error.

// RULE 3 — arrow functions INHERIT this from their birth scope: the fix.
const counter2 = {
  value: 7,
  later() {
    // setTimeout runs the function LATER — but an arrow keeps `this`:
    setTimeout(() => console.log(`arrow kept this: ${this.value}`), 50);
    // the equivalent plain function would lose `this` (undefined.value → throw)
  },
};
counter2.later(); // (after 50 ms) arrow kept this: 7

// RULE 4 — new / class: this = the fresh instance.
class Dog {
  constructor(name) { this.name = name; }
}
console.log(new Dog("Rex").name); // Rex

// Expected output:
//   this.value is 10
//   arrow kept this: 7   (50 ms later)
//   Rex
