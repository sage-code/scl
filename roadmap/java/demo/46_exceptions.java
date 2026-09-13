/* Java lab demo 46 — catching an ArithmeticException.
 *
 * Run:  javac 46_exceptions.java  &&  java Exceptions
 */
class Exceptions {

    public static void main (String[] a) {
      int x = 0;

      try {
         x = 1/0;
         System.out.println(x);
      } catch (ArithmeticException e) {
         System.out.println(e.getMessage());
      }

    }
}
