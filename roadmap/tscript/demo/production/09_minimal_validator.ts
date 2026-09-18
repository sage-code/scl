/**
 * 09_minimal_validator.ts — parse, don't validate, at the boundary
 *
 * PURPOSE: TypeScript types are erased (see demo 01), so data from
 * outside — fetch responses, JSON.parse, form input — is NOT typed no
 * matter what the annotation says. This demo hand-rolls a tiny validator:
 * it returns the parsed value WITH a checked type, or a typed error.
 * Run with:
 *
 *   npx tsx 09_minimal_validator.ts
 *
 * WHAT WE LEARN: "parse, don't validate" — validate once at the boundary
 * and the checked type flows through the rest of the program. This is the
 * job Zod/Valibot do for a living; here is the 40-line core so you
 * understand what you are buying.
 */

type Parser<T> = (raw: unknown) => Result<T, string>;

// Reuse the Result type from demo 08:
type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

// Composable primitive parsers
const str: Parser<string> = (raw) =>
  typeof raw === "string" ? { ok: true, value: raw }
                          : { ok: false, error: "expected string" };

const num: Parser<number> = (raw) =>
  typeof raw === "number" ? { ok: true, value: raw }
                          : { ok: false, error: "expected number" };

// Object parser built FROM primitives — inferred, not hand-written
function obj<P extends Record<string, Parser<unknown>>>(
  shape: P,
): Parser<{ [K in keyof P]: P[K] extends Parser<infer U> ? U : never }> {
  return (raw) => {
    if (typeof raw !== "object" || raw === null) {
      return { ok: false, error: "expected object" };
    }
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(shape)) {
      const field = shape[key]((raw as Record<string, unknown>)[key]);
      if (!field.ok) return { ok: false, error: `${key}: ${field.error}` };
      out[key] = field.value;
    }
    return { ok: true, value: out as never };
  };
}

const userParser = obj({ name: str, age: num });

// Real boundary: JSON.parse returns any — this is where types begin
const good: unknown = JSON.parse('{"name":"Ada","age":36}');
const bad: unknown = JSON.parse('{"name":"Bob","age":"old"}');

console.log(userParser(good)); // { ok: true, value: { name: "Ada", age: 36 } }
console.log(userParser(bad));  // { ok: false, error: "age: expected number" }
