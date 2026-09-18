// 18_classes_lab.js — class, #private, static, extends, instanceof.
// Run:   node 18_classes_lab.js

class Account {
  #balance = 0;                    // PRIVATE: only class code can read/write it

  static currency = "EUR";         // static: lives on the CLASS, not instances
  static accountsCreated = 0;

  constructor(owner) {
    this.owner = owner;            // public field, set per instance
    Account.accountsCreated += 1;  // tick the class-level counter
  }

  deposit(amount) {
    if (amount <= 0) throw new TypeError("deposit must be positive");
    this.#balance += amount;       // private field, only visible in here
    return this.#balance;
  }

  get balance() {                  // getter: account.balance reads like a property
    return this.#balance;
  }
}

class SavingsAccount extends Account {
  constructor(owner, interest) {
    super(owner);                  // MUST call super before using `this`
    this.interest = interest;
  }
  describe() {
    // super.static… — static members are reached via the class name:
    return `${this.owner}: ${this.balance} ${Account.currency}` +
           ` @ ${this.interest * 100}%`;
  }
}

const savings = new SavingsAccount("Ada", 0.02);
savings.deposit(100);
console.log(savings.describe());     // Ada: 100 EUR @ 2%
console.log(savings instanceof Account);         // true
// console.log(savings.#balance);     // SyntaxError — private is private, even outside
console.log(Account.accountsCreated); // 1

// Expected output:
//   Ada: 100 EUR @ 2%
//   true
//   1
