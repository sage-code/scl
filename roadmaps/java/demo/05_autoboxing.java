/* Java lab demo 05 — automatic conversion between int and Integer.
 *
 * Run:  javac 05_autoboxing.java  &&  java AutoBoxing
 */
class AutoBoxing {
  public static void main (String[] args) {
    int x = 0;
    Integer y = x;
    assert (x == y);
    System.out.println("done.");
  }
}
