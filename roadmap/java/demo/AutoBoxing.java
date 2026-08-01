public class AutoBoxing {
  public static void main (String[] args) {
    int x = 0;
    Integer y = x;
    assert (x == y);
    System.out.println("done.");
  }
}
