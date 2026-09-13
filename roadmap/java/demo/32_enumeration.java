/* Java lab demo 32 — an enum type compared with ==.
 *
 * Run:  javac 32_enumeration.java  &&  java Enumeration
 */
class Enumeration {
  //type definition
  public enum day {Monday, Tuesday, Saturday};

  public static void main (String[] a) {
    day d = day.Saturday;

    if (d == day.Saturday) {
      System.out.println("is weekend");
    }
  }
}
