/* Java lab demo 47 — throwing a checked exception.
 *
 * Run:  javac 47_exception_throw.java  &&  java ExceptionThrow
 */
class ExceptionThrow {

  public static void main (String[] a) throws Exception {
    throw new Exception("Crash and burn!");
  }
}
