public class Exceptions {

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
