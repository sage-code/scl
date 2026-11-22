/**
 * 02_strict_catches_bugs.ts — one bug, checked and unchecked
 *
 * PURPOSE: show what "strict" actually changes on a bug every JS developer
 * has shipped: reading a property that may not exist. Uncomment the marked
 * lines one at a time and re-run the checker:
 *
 *   npx tsc --strict --noEmit 02_strict_catches_bugs.ts
 *
 * WHAT WE LEARN: strictNullChecks turns a runtime crash ("Cannot read
 * properties of undefined") into a compile-time error with a location.
 * The fix is not a cast — it is handling the case, exactly what the
 * runtime would have needed anyway.
 */

type Config = { retries?: number };

const config: Config = {};

// This compiles and runs — and is where JS bugs are born:
console.log("retries:", config.retries ?? 0); // guard at the read site

// The unchecked version: what plain JS allows and crashes on.
// Uncomment to see error TS18048 / TS2532 appear under strict mode:
// const current = config.retries;
// console.log(current + 1);   // Object is possibly 'undefined'

// The type-safe fix — narrow before use, once, at the boundary:
function nextRetry(c: Config): number {
  if (c.retries === undefined) return 1; // handle the absent case
  return c.retries + 1;                  // now the type is number
}
console.log("next retry:", nextRetry(config)); // 1
