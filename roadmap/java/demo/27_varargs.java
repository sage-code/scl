/* Java lab demo 27 — variable arity parameters.
 *
 * Run:  javac 27_varargs.java  &&  java Varargs
 */
class Varargs {

  //input & output parameter
  private static void test(Integer... args) {
    for (int x: args) System.out.println(x);
  }

  public static void main(String args[]) {
    test(1,2,3);
  }
}
