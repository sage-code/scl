/* Java lab demo 24 — declare a method and call it from main.
 *
 * Run:  javac 24_function_call.java  &&  java FunctionCall
 */
class FunctionCall {

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
