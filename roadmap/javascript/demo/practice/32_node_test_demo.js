/**
 * 32_node_test_demo.js — a complete node:test suite in one runnable file.
 *
 * Run with:  node --test demo/practice/32_node_test_demo.js
 * Watch:     node --test --watch demo/practice/32_node_test_demo.js
 *
 * Demonstrates: plain tests, nested describe blocks, before/after hooks,
 * async tests, assert.rejects, and test todos — the whole no-framework loop
 * from the Testing and Quality lesson.
 */

const test = require("node:test");
const assert = require("node:assert");

// --- The code under test: a tiny in-memory bank -------------------------------
// Deliberately small so the TESTS are the interesting part. Every rule the
// lessons taught is contract here: error types (lesson 14), immutability
// habits (lesson 24), and messages that are user-facing promises.

class Account {
  constructor(owner, balance = 0) {
    this.owner = owner;
    this.balance = balance;
  }
  deposit(amount) {
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new RangeError(`deposit must be a positive integer (got ${amount})`);
    }
    return new Account(this.owner, this.balance + amount); // immutable update
  }
  withdraw(amount) {
    if (amount > this.balance) {
      throw new RangeError(`insufficient funds: balance ${this.balance}, wanted ${amount}`);
    }
    return new Account(this.owner, this.balance - amount);
  }
  static async asyncTransfer(from, to, amount) {
    return [from.withdraw(amount), to.deposit(amount)]; // async path for await tests
  }
}

// --- The suite ----------------------------------------------------------------

test("Account deposits", async (t) => {
  // Hooks run before each test in this block — fresh state without repetition.
  let account;
  t.beforeEach(() => { account = new Account("ada", 100); });

  await t.test("increases the balance (happy path)", () => {
    assert.strictEqual(account.deposit(50).balance, 150);
  });

  await t.test("rejects non-positive amounts with a RangeError", () => {
    assert.throws(() => account.deposit(0), RangeError);
    assert.throws(() => account.deposit(-5), RangeError);
  });

  await t.test("its message is a contract — assert it", () => {
    assert.throws(() => account.deposit(2.5), /positive integer/);
  });

  await t.test("does not mutate the original account", () => {
    account.deposit(50);
    assert.strictEqual(account.balance, 100); // lesson 24: references stay honest
  });
});

test("async transfer moves money both ways", async () => {
  const from = new Account("a", 100);
  const to = new Account("b", 0);

  const [newFrom, newTo] = await Account.asyncTransfer(from, to, 40); // await: a 0ms
  assert.strictEqual(newFrom.balance, 60);                            // pass would be
  assert.strictEqual(newTo.balance, 40);                              // suspicious here
});

test("overdraft rejection surfaces as a rejection, not a throw", async () => {
  await assert.rejects(
    () => Account.asyncTransfer(new Account("a", 10), new Account("b"), 50),
    (error) => error instanceof RangeError && /insufficient funds/.test(error.message),
  );
});

test("architecture of the suite itself", { todo: "fuzz the deposit amount next" });
