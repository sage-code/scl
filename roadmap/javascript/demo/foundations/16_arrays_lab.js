// 16_arrays_lab.js — mutation, the sort trap, and pipelines.
// Run:   node 16_arrays_lab.js

// MUTATING methods change the array; the to* family returns a COPY.
const scores = [3, 1, 2];
scores.push(4);                 // mutate: add at the end
console.log(scores);            // [ 3, 1, 2, 4 ]
console.log(scores.toSorted()); // [ 1, 2, 3, 4 ] — a copy, original untouched
console.log(scores);            // [ 3, 1, 2, 4 ] — original order survives

// THE SORT TRAP: default sort converts items to TEXT first.
const numbers = [10, 9, 100, 1];
console.log(numbers.sort());
// -> [ 1, 10, 100, 9 ]  — because "1" < "10" < "100" < "9" as TEXT
// The fix: a compare function. Note sort() MUTATES — numbers is already
// reordered, which is why this lab sorts a COPY from here on:
console.log([...numbers].sort((a, b) => a - b)); // [ 1, 9, 10, 100 ]

// The transformation pipeline: filter -> map -> reduce.
const orders = [
  { id: 1, total: 25,  paid: true },
  { id: 2, total: 120, paid: false },
  { id: 3, total: 80,  paid: true },
];
const revenue = orders
  .filter(order => order.paid)               // keep paid orders
  .map(order => order.total)                 // project to amounts
  .reduce((sum, amount) => sum + amount, 0); // fold into one number
console.log(revenue);                        // 105

// find / some / every answer single questions:
console.log(orders.find(o => o.id === 2).total); // 120
console.log(orders.some(o => o.total > 100));    // true
console.log(orders.every(o => o.paid));          // false

// SPARSE ARRAYS: delete leaves a HOLE, not an undefined-at-an-index.
const sparse = [1, 2, 3];
delete sparse[1];
console.log(1 in sparse);   // false — a hole, not a value
console.log(sparse.length); // 3 — length still counts the hole
console.log(sparse.map(x => "x")); // holes are skipped (callback not called)
// -> [ 'x', <1 empty item>, 'x' ] — the hole stays a hole: misaligned results!
// Habit: use splice / toSpliced, or assign undefined, instead of delete.

// Expected output:
//   [ 3, 1, 2, 4 ]
//   [ 1, 2, 3, 4 ]
//   [ 3, 1, 2, 4 ]
//   [ 1, 10, 100, 9 ]
//   [ 1, 9, 10, 100 ]
//   105
//   120
//   true
//   false
//   false
//   3
