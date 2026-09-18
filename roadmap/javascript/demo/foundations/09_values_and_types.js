// 09_values_and_types.js — the seven primitive types, by experiment.
// Run:   node 09_values_and_types.js

// typeof reports the type of any value. Predict each result first.
console.log(typeof "hi");        // string  — text in quotes
console.log(typeof 5);           // number  — EVERY number, integer or not
console.log(typeof 5.5);         // number  — there is no separate int type
console.log(typeof true);        // boolean
console.log(typeof undefined);   // undefined — declared but never given a value
console.log(typeof Symbol());    // symbol   — unique identifiers (rare, day one)
console.log(typeof 10n);         // bigint   — arbitrarily large integers

// A famous trap: typeof null says "object". It is a bug kept for compatibility.
console.log(typeof null);        // object  <- the language's oldest mistake

// null vs undefined: "deliberately empty" vs "never filled in".
let chosen = null;   // the code SETTLED on empty
let notSet;          // nothing was assigned yet
console.log(chosen, notSet);      // null undefined

// NaN — "not a number", the result of broken math. It is not equal to itself!
console.log(0 / 0);               // NaN
console.log(NaN === NaN);         // false — test with Number.isNaN instead

// Objects are NOT primitives — and they copy by address (see the lesson diagram).
const original = { score: 10 };
const alias = original;           // no copy is made
alias.score = 99;
console.log(original.score);      // 99 — both names, one object

// Expected output:
//   string number number boolean undefined symbol bigint
//   object
//   null undefined
//   NaN
//   false
//   99
