// 03_errors_on_purpose.js — meet the three errors every beginner meets,
// in a safe way: each one is caught, so the file runs to the end.
// Run:   node 03_errors_on_purpose.js
//
// try { ... } catch (error) { ... } runs the code and, if it fails,
// hands you the error as a value. We only use it here to PRINT the errors —
// lesson 14 (Errors) teaches it properly.

// 1) SyntaxError — the text is not valid JavaScript; the file does not even start.
//    Remove the // from the next line and run again, then put it back:
// console.log("oops"

// 2) ReferenceError — you used a name the engine has never seen.
try {
  console.log(mesage); // typo on purpose: no such name exists
} catch (error) {
  console.log(error.name + ": " + error.message);
  // -> ReferenceError: mesage is not defined
}

// 3) TypeError — the value cannot do what you asked of it.
try {
  const total = 5;
  total(); // calling a number as if it were a function
} catch (error) {
  console.log(error.name + ": " + error.message);
  // -> TypeError: total is not a function
}

console.log("Done. Read every error as: name, then message, then line number.");
// Expected output:
//   ReferenceError: mesage is not defined
//   TypeError: total is not a function
//   Done. Read every error as: name, then message, then line number.
