// 10_coercion_lab.js — run the coercion table yourself; no mystery allowed.
// Run:   node 10_coercion_lab.js

// == CONVERTS the two sides to matching types, then compares.
// === compares type AND value. Always use ===; the lab proves why.
console.log("5" == 5);    // true  — "5" was converted to 5 first
console.log("5" === 5);   // false — string vs number: different types
console.log(0 == "");     // true  — "" converts to 0. Useful? No. Surprising? Yes.
console.log(0 === "");    // false
console.log(null == undefined);  // true  — a special rule
console.log(null === undefined); // false

// Truthiness: every value is secretly true or false inside an if.
const falsy = [0, "", null, undefined, NaN, false];
console.log("falsy values:", falsy.length, "of them"); // exactly six

// || returns the FIRST truthy side — but see the zero trap below.
const volume = 0;
console.log(volume || 50);  // 50  <- 0 is falsy, so the fallback fired. BUG!
console.log(volume ?? 50);  // 0   <- ?? only falls back on null/undefined

// The + operator prefers strings (see the lesson's diagram).
console.log(1 + 2);          // 3
console.log("1" + 2);        // "12"
console.log(1 + 2 + "3");    // "33" — left to right: 3, then "3" + "3"

// Floating point: decimals are approximations.
console.log(0.1 + 0.2);                       // 0.30000000000000004
console.log((0.1 * 10 + 0.2 * 10) / 10);      // 0.3 — the standard money fix

// Expected output: true false true false true false
//   falsy values: 6 of them
//   50 0
//   3 "12" "33"
//   0.30000000000000004 0.3
