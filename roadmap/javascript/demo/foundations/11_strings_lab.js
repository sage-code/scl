// 11_strings_lab.js — the everyday string toolkit, with outputs.
// Run:   node 11_strings_lab.js

const name = "  Ada Lovelace  ";

// Strings are immutable: every method RETURNS a new string.
console.log(name.trim());           // "Ada Lovelace" — ends cleaned
console.log(name.trim().length);    // 12 (the original had 16)
console.log(name.toUpperCase());    // "  ADA LOVELACE  " — original unchanged

// Search and slice: start index, end index EXCLUDED.
const file = "report-2026.pdf";
console.log(file.includes("2026"));         // true
console.log(file.startsWith("report"));     // true
console.log(file.slice(7, 11));             // "2026"
console.log(file.slice(-4));                // ".pdf" — negative counts from the end

// split makes an array; join is its partner.
const csv = "ada,grace,alan";
console.log(csv.split(","));          // [ 'ada', 'grace', 'alan' ]

// Template literals: variables INSIDE text — no more quote juggling.
const hour = 9;
console.log(`Session starts at ${hour}:00 and lasts ${2 * 45} minutes`);
// -> Session starts at 9:00 and lasts 90 minutes

// The emoji trap: .length counts UTF-16 code units, not what you see.
const thumbs = "👍";
console.log(thumbs.length);           // 2 (!) — it is stored as two units
console.log([...thumbs].length);      // 1 — spread iterates real characters

// Expected output:
//   Ada Lovelace
//   12
//     ADA LOVELACE
//   true true
//   2026
//   .pdf
//   [ 'ada', 'grace', 'alan' ]
//   Session starts at 9:00 and lasts 90 minutes
//   2
//   1
