/* Java lab demo 25 — method overloading.
 *
 * Overloading means several methods share one name but differ in their
 * parameter lists. The compiler chooses at the call site from the number and
 * types of the arguments — it is resolved at compile time, not at run time.
 *
 * The helper lives in a static nested class: `static` makes the nested type
 * belong to the outer type instead of to an instance of it, so `Multiply.mul`
 * is reachable from a static main method.
 *
 * Run:  javac 25_overloaded_methods.java  &&  java Overloaded
 */
class Overloaded {

  static class Multiply {

    static int mul(int a, int b) {
      return a * b;
    }

    static int mul(int a, int b, int c) {
      return a * b * c;
    }

    // Same name, different parameter types: a third overload.
    static double mul(double a, double b) {
      return a * b;
    }
  }

  public static void main(String[] args) {
    System.out.println(Multiply.mul(2, 3));       // int, int
    System.out.println(Multiply.mul(2, 3, 4));    // int, int, int
    System.out.println(Multiply.mul(2.5, 4.0));   // double, double
  }
}
