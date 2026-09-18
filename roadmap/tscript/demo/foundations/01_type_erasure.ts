/**
 * 01_type_erasure.ts — see the compiler's erase step in action
 *
 * PURPOSE: prove the claim from the compiler lesson: annotations, interfaces
 * and generics exist only at design time. Run it two ways and compare:
 *
 *   npx tsx 01_type_erasure.ts     (tsx strips types, runs the JS)
 *   npx tsc 01_type_erasure.ts     (emit) → open dist/01_type_erasure.js
 *
 * WHAT WE LEARN: the emitted JavaScript contains none of the type syntax.
 * Anything you need at runtime (validation, labels, wire format) must be
 * written as runtime code, not as a type.
 */

// Pure type syntax — erased completely on emit
interface User {
  id: number;
  name: string;
}

// Annotations on parameters and the return type — also erased
function toLabel(user: User): string {
  return `user-${user.id}: ${user.name}`;
}

// A generic function: T is chosen by the compiler, not the runtime
function first<T>(items: T[]): T | undefined {
  return items.length > 0 ? items[0] : undefined;
}

const ada: User = { id: 42, name: "Ada" };
console.log(toLabel(ada));            // user-42: Ada
console.log(first([1, 2, 3]));        // 1
console.log(first([]));               // undefined — the | undefined pays off

// The runtime proof: only JavaScript values exist here
console.log(typeof ada);              // "object" — not "User"
