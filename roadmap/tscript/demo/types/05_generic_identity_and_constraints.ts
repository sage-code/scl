/**
 * 05_generic_identity_and_constraints.ts — your first reusable abstractions
 *
 * PURPOSE: show why generics beat `any` for reusable code: the input and
 * output stay connected, so the checker tracks the exact type through the
 * function. Run with:
 *
 *   npx tsx 05_generic_identity_and_constraints.ts
 *
 * WHAT WE LEARN: (1) inference — you rarely write the type argument; the
 * compiler infers it from the arguments. (2) `extends` constraints say what
 * a generic REQUIRES without giving up type identity. (3) `keyof` keeps
 * property access honest — the classic `pickField` bug becomes a compile
 * error instead of a runtime `undefined`.
 */

// identity: in and out are the SAME type
function identity<T>(value: T): T {
  return value;
}

const n = identity(42);        // n: number (inferred — not any, not unknown)
const s = identity("hello");   // s: string
console.log(n, s);

// Constraint: T must have a .length — arrays and strings qualify
function longest<T extends { length: number }>(a: T, b: T): T {
  return a.length >= b.length ? a : b;
}
console.log(longest([1, 2], [1]));          // [1, 2]
console.log(longest("lizard", "ox"));       // lizard

// keyof: only REAL property names of T are accepted
function pickField<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { id: 1, name: "Ada", admin: false };
console.log(pickField(user, "name")); // "Ada" — return type is string
// pickField(user, "email");  // ← compile error: "email" is not a key of user
