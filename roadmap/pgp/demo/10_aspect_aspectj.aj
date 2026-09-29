// 10 - Aspect-oriented programming: AspectJ, an extension of Java that adds
// aspects — modules for a concern that would otherwise be scattered across
// many unrelated classes, like logging, timing, or security checks.

class Account {
    private double balance = 0;

    public void deposit(double amount) {
        balance += amount;
    }

    public void withdraw(double amount) {
        balance -= amount;
    }
}

// The aspect: this logging code lives in exactly one place, yet applies to
// every method call it matches — no edits needed inside Account itself.
aspect LoggingAspect {

    // A pointcut: which join points (method calls, here) this aspect cares about
    pointcut accountOperation(): execution(void Account.deposit(double))
                              || execution(void Account.withdraw(double));

    // Advice: code that runs "before" every matched call
    before(): accountOperation() {
        System.out.println("Before: " + thisJoinPoint.getSignature());
    }

    // Advice: code that runs "after" every matched call
    after(): accountOperation() {
        System.out.println("After: " + thisJoinPoint.getSignature());
    }
}

// Without AspectJ, this same logging would mean adding a println at the top
// and bottom of every method, in every class, that needs it — and remembering
// to do it again for every new method added later. The aspect crosscuts
// Account's own logic instead of being tangled inside it.
