/**
 * 10_bank_account.ts — a class whose invariants the compiler enforces
 *
 * PURPOSE: finish the phase-2 classes lesson arc: the constructor builds a
 * VALID account, private fields keep it valid, and every mutation either
 * preserves the invariant or returns a typed failure. Run with:
 *
 *   npx tsx 10_bank_account.ts
 *
 * WHAT WE LEARN: TypeScript cannot check business rules like
 * "balance >= 0" — but it CAN restrict who may change state and how.
 * Private fields + Result returns push every invalid transition to a
 * compile-checked branch, so an overdrawn account becomes impossible to
 * construct, not merely unlikely.
 */

type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

type OverdraftError = { code: "OVERDRAFT"; requested: number; balance: number };
type FrozenError = { code: "FROZEN" };

class BankAccount {
  #balance: number; // private field — inaccessible from outside
  #frozen = false;

  // The ONLY way to get an account: through validation
  static open(initialCents: number): Result<BankAccount, string> {
    if (initialCents < 0) return { ok: false, error: "negative opening deposit" };
    return { ok: true, value: new BankAccount(initialCents) };
  }

  private constructor(initialCents: number) { // private: no bypass
    this.#balance = initialCents;
  }

  balance(): number { return this.#balance; }

  withdraw(cents: number): Result<number, OverdraftError | FrozenError> {
    if (this.#frozen) return { ok: false, error: { code: "FROZEN" } };
    if (cents > this.#balance) {
      return { ok: false, error: { code: "OVERDRAFT", requested: cents, balance: this.#balance } };
    }
    this.#balance -= cents; // invariant holds: cents <= balance
    return { ok: true, value: this.#balance };
  }

  freeze(): void { this.#frozen = true; }
}

// Happy path
const acct = BankAccount.open(500);
if (acct.ok) {
  console.log("opened with", acct.value.balance());
  const w = acct.value.withdraw(300);
  if (w.ok) console.log("balance after withdraw:", w.value); // 200
}

// Failure paths — every one is a typed branch, not a surprise exception
const w2 = acct.ok ? acct.value.withdraw(10_000) : null;
if (w2 && !w2.ok) console.log("refused:", w2.error.code, w2.error.requested);

// BankAccount.open(-1)  → { ok: false, error: "negative opening deposit" }
// new BankAccount(...)  → compile error: constructor is private
