public class FunctionCall {

  private static int sum(int a, int b) {
    return a + b;
  }

  public static void main(String args[]) {
    int x = 1;
    int y = 2;
    int r = sum(x, y);
    System.out.println("r =" + r);
  }

}
