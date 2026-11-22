// 13_functions_lab.js — the three ways to write a function, and returns.
// Run:   node 13_functions_lab.js

// 1. Declaration: hoisted — callable before its line appears.
console.log(add(2, 3)); // 5 — works even though add is defined below
function add(a, b) {
  return a + b; // return hands the value back AND stops the function
}

// 2. Function expression: a function stored in a variable (NOT hoisted).
const multiply = function (a, b) {
  return a * b;
};
console.log(multiply(2, 3)); // 6

// 3. Arrow function: shorter; returns automatically if you skip the braces.
const square = n => n * n;
const greet = (name, greeting = "Hello") => `${greeting}, ${name}!`;
console.log(square(4));            // 16
console.log(greet("Ada"));         // Hello, Ada!
console.log(greet("Ada", "Hi"));   // Hi, Ada!

// Default and rest parameters.
function total(first, ...others) {
  return first + others.reduce((sum, n) => sum + n, 0);
}
console.log(total(1, 2, 3, 4)); // 10 — others gathered [2, 3, 4]

// A function without return gives back undefined — the mystery from lesson 01.
function noReturn() {
  const x = 1 + 1; // computed, then dropped
}
console.log(noReturn()); // undefined

// Expected output:
//   5
//   6
//   16
//   Hello, Ada!
//   Hi, Ada!
//   10
//   undefined
