/**
 * 04_discriminated_union_state.ts — the discriminated-union state machine
 *
 * PURPOSE: this is the pattern that replaces boolean-flag soup from JS.
 * One "tag" field tells the compiler exactly which shape it is looking at,
 * so every state's data is guaranteed present — and exhaustive `switch`
 * checks become provable. Run with:
 *
 *   npx tsx 04_discriminated_union_state.ts
 *
 * WHAT WE LEARN: never model mutually exclusive states as
 * `{ isLoading: boolean; error?: string; data?: T }` — that type admits
 * impossible combinations (loading AND data). Discriminated unions make
 * illegal states unrepresentable, and `never` exhaustiveness makes the
 * compiler flag every new state you forget to handle.
 */

type FetchState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }       // data ONLY exists in success
  | { status: "error"; message: string } // message ONLY exists in error
  | { status: "cancelled" };

function render<T>(state: FetchState<T>): string {
  switch (state.status) {
    case "idle":
      return "nothing requested yet";
    case "loading":
      return "loading…";
    case "success":
      return `got ${JSON.stringify(state.data)}`; // data is guaranteed here
    case "error":
      return `failed: ${state.message}`;          // message guaranteed here
    case "cancelled":
      return "request cancelled";
    default: {
      // If a new status is added to the union, this line stops compiling:
      const neverState: never = state;
      return neverState;
    }
  }
}

const states: FetchState<string[]>[] = [
  { status: "idle" },
  { status: "loading" },
  { status: "success", data: ["a", "b"] },
  { status: "error", message: "HTTP 503" },
  { status: "cancelled" },
];
for (const s of states) console.log(render(s));
