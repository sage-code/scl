/**
 * 03_unions_and_narrowing.ts — model alternatives, then separate them
 *
 * PURPOSE: unions model "one of several shapes"; narrowing lets the checker
 * follow your runtime checks. Run with:
 *
 *   npx tsx 03_unions_and_narrowing.ts
 *
 * WHAT WE LEARN: `typeof`/`in` checks are not just runtime guards — they
 * are also type queries the compiler understands. After the check, the
 * variable's type is narrowed; no casts needed anywhere.
 */

// A value that is one of three distinct shapes
type Reservation = string | number | Date;

function describe(r: Reservation): string {
  // `typeof` narrows unions of primitive types
  if (typeof r === "string") return `guest name: ${r}`;
  if (typeof r === "number") return `confirmation #: ${r}`;
  // here r is Date — the only remaining member
  return `booking on ${r.toISOString().slice(0, 10)}`;
}

console.log(describe("Ada"));
console.log(describe(90210));
console.log(describe(new Date("2026-09-18T12:00:00Z")));

// `in` narrows unions of object shapes
type Cat = { meow: () => string };
type Dog = { bark: () => string };

function speak(pet: Cat | Dog): string {
  return "meow" in pet ? pet.meow() : pet.bark();
}

console.log(speak({ meow: () => "mrrp" }));   // mrrp
console.log(speak({ bark: () => "woof" }));   // woof
