/* Java lab demo 29 — classes, constructors and encapsulation.
 *
 * A class groups state (fields) with the behaviour that is allowed to change
 * it. The balance stays private, so the only ways in are deposit(), withdraw()
 * and close(); the constructor guarantees every account is born with an
 * identity. The interesting case is withdraw() asking for more than is there.
 *
 * File name note: a `public` class would force the file to be named after it,
 * which collides with the numbered demo names. All lab demos keep a
 * package-private class and are run by class name.
 *
 * Run:  javac 29_account.java  &&  java Account
 */
class Account {

  // Public identity: safe to read from anywhere.
  Integer number;
  String type;

  // Private balance: reachable only through the methods below.
  private long amount;

  // Constructor — same name as the class, and no return type.
  Account(int number, String type) {
    this.number = number;
    this.type = type;
  }

  // Pay out at most what is actually in the account: if the request is larger
  // than the balance, the account is emptied rather than going negative.
  long withdraw(long requested) {
    if (amount > requested) {
      amount -= requested;
      return requested;
    }
    long paid = amount;
    amount = 0;
    return paid;
  }

  void deposit(long value) {
    amount += value;
  }

  // Close the account: hand back what is left, then zero the balance.
  long close() {
    long left = amount;
    amount = 0;
    return left;
  }

  long getAmount() {
    return amount;
  }

  public static void main(String[] args) {
    Account checking = new Account(2021, "checking");
    System.out.println("New account: " + checking.number + " (" + checking.type + ")");

    checking.deposit(100);
    checking.withdraw(10);
    System.out.println("Current amount: " + checking.getAmount());

    // Ask for more than the balance: only what exists is paid out.
    System.out.println("Withdrew: " + checking.withdraw(1000));
    System.out.println("Balance after: " + checking.getAmount());

    System.out.println("Closed with: " + checking.close());
  }
}
