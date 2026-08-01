public class Enumeration {
  //type definition
  public enum day {Monday, Tuesday, Saturday};

  public static void main (String[] a) {
    day d = day.Saturday;

    if (d == day.Saturday) {
      System.out.println("is weekend");
    }
  }
}
