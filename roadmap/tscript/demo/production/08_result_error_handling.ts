/**
 * 08_result_error_handling.ts — errors as values the checker tracks
 *
 * PURPOSE: exceptions are invisible to the type system — a caller cannot
 * see what a function may throw. The Result pattern makes failure part of
 * the return type, so the compiler refuses to ignore it. Run with:
 *
 *   npx tsx 08_result_error_handling.ts
 *
 * WHAT WE LEARN: discriminated unions + exhaustive handling = no forgotten
 * error paths. This mirrors the discriminated-union demo but for control
 * flow instead of fetch state — and it is how Rust/Go/OCaml model errors,
 * and increasingly how modern TS libraries do (neverthrow, effect).
 */

type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) return { ok: false, error: "divide by zero" };
  return { ok: true, value: a / b };
}

// The caller CANNOT touch .value without proving which branch it is in:
function show(result: Result<number, string>): string {
  if (result.ok) return `result = ${result.value}`; // narrowed: has .value
  return `error: ${result.error}`;                  // narrowed: has .error
}

console.log(show(divide(10, 4)));  // result = 2.5
console.log(show(divide(1, 0)));   // error: divide by zero

// Composing fallible steps without try/catch pyramids:
function runCalc(): Result<number, string> {
  const step1 = divide(20, 5);          // ok: 4
  if (!step1.ok) return step1;          // propagate failure early
  const step2 = divide(step1.value, 0); // fails
  if (!step2.ok) return step2;
  return step2;
}
console.log(show(runCalc()));
