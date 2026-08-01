public class RecursiveFun {

    private final static
         String mode = "test";
    public static void main(String[] a) {
    System.out.println(factorial(1));
    System.out.println(factorial(2));
    System.out.println(factorial(3));
    System.out.println(mode);
  }

  private static int factorial(int i) {
    if (i > 1)
      return i * factorial(i-1);
    else
      return 1;
  }

}
