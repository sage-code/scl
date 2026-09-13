/* Java lab demo 36 — access modifiers and packages.
 *
 * Java has four visibility levels: private (this class only), package-private
 * (this package only — written by leaving the modifier out, which is why this
 * demo class has no `public`), protected (the package plus subclasses), and
 * public (everyone). A class that lives in a package is named by its fully
 * qualified name, e.g. com.example.Wallet; the package statement must be the
 * first line of the file and the file must sit in the matching folder.
 *
 * Run:  javac 36_package_visibility.java  &&  java VisibilityDemo
 */
class Wallet {

  private long secret = 42;          // only Wallet itself

  long packageWide = 7;              // any class in the same package

  protected long forSubclasses = 5;  // same package plus every subclass

  public long everybody = 1;         // anyone, anywhere

  // Private helper: invisible even to a subclass.
  private long reveal() {
    return secret;
  }

  // Public doorway to the private state — this is how encapsulation works.
  public long readSecret() {
    return reveal();
  }
}

class Savings extends Wallet {
  long doubleProtected() {
    return forSubclasses * 2;        // protected is visible in a subclass
  }
}

class VisibilityDemo {
  public static void main(String[] args) {
    Wallet wallet = new Wallet();
    Savings savings = new Savings();

    System.out.println("public:            " + wallet.everybody);
    System.out.println("package-private:   " + wallet.packageWide);
    System.out.println("protected subclass:" + savings.doubleProtected());
    System.out.println("private via method:" + wallet.readSecret());
  }
}
