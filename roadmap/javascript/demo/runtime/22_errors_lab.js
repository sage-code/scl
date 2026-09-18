/**
 * 22_errors_lab.js — triggers every error type on purpose and catches them by class.
 *
 * Study loop: read each block, predict the output line, run with `node 22_errors_lab.js`,
 * then compare. The "expected" comments below document the real message text — error
 * messages are data you can program against, not noise to ignore.
 */

// --- Part 1: the runtime error taxonomy --------------------------------------
// Each probe throws a different built-in error class. We catch by class with
// `instanceof` instead of parsing message strings — messages vary across engines,
// classes do not.

function probe(label, fn) {
  try {
    fn();
    console.log(`${label}: no error (unexpected!)`);
  } catch (error) {
    console.log(`${label} → ${error.name}: ${error.message}`);
  }
}

probe("undeclared name", () => {
  // A typo'd name is a ReferenceError: the binding does not exist in any scope.
  return notDeclaredAnywhere;
});

probe("bad method call", () => {
  // The value exists; the method does not belong to it. TypeError, not ReferenceError.
  const count = 3;
  return count.toUpperCase();
});

probe("null property read", () => {
  // The #1 production crash: reading a property of null/undefined.
  const user = null;
  return user.role;
});

probe("bad range", () => {
  // Right type (a number), wrong range: array lengths cannot be negative.
  return new Array(-5);
});

// Expected output:
// undeclared name → ReferenceError: notDeclaredAnywhere is not defined
// bad method call → TypeError: count.toUpperCase is not a function
// null property read → TypeError: Cannot read properties of null (reading 'role')
// bad range → RangeError: Invalid array length

// --- Part 2: syntax errors happen before ANY of this file runs ---------------
// Uncomment the next line and the whole file fails to parse — even Part 1's output
// disappears. That is what "parse time" means.
// const broken = [1, 2, 3;

// --- Part 3: custom error subclass + filtering -------------------------------
// Subclassing Error lets callers branch on TYPE (stable) instead of on message
// text (fragile). Setting .name keeps logs readable.

class ValidationError extends Error {
  constructor(message) {
    super(message);                 // sets .message and .stack via the Error constructor
    this.name = "ValidationError";  // otherwise logs would say "Error"
  }
}

function parseAge(raw) {
  // Boundary function: the caller may be anyone, so validate before using.
  const n = Number(raw); // careful: Number("") is 0 and Number(null) is 0 — check the raw string too
  if (raw === null || raw.trim() === "" || Number.isNaN(n)) {
    throw new ValidationError(`age must be a number (got ${JSON.stringify(raw)})`);
  }
  if (n < 0 || !Number.isInteger(n)) {
    throw new ValidationError(`age must be a non-negative integer (got ${n})`);
  }
  return n;
}

const cases = ["42", "", "abc", "-3", "7.5"];
for (const raw of cases) {
  try {
    console.log(`parseAge(${JSON.stringify(raw)}) →`, parseAge(raw));
  } catch (error) {
    if (error instanceof ValidationError) {
      console.log(`parseAge(${JSON.stringify(raw)}) rejected → ${error.message}`);
    } else {
      throw error; // never swallow errors that are not ours to handle
    }
  }
}

// Expected output:
// parseAge("42") → 42
// parseAge("") rejected → age must be a number (got "")
// parseAge("abc") rejected → age must be a number (got "abc")
// parseAge("-3") rejected → age must be a non-negative integer (got -3)
// parseAge("7.5") rejected → age must be a non-negative integer (got 7.5)

// --- Part 4: the empty-catch trap --------------------------------------------
// Watch what a swallow does: the program "succeeds" with data nobody validated.

function loadConfigSwallow(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return {}; // the bug: silently pretending the input was fine
  }
}

const config = loadConfigSwallow("{oops");
// config looks empty but valid — and the missing keys surface 500 lines later.
console.log("swallowed config keys:", Object.keys(config), "(and the real bug is far away)");

// Expected output:
// swallowed config keys: [] (and the real bug is far away)
