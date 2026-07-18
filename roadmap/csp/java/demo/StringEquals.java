import static java.lang.System.out;
public class StringEquals {
  public static void main(String args[]) {
    String str1 = "test";
    String str2 = new String("test");

    out.println(str1.equals(str2));
    out.println(str1 == str2);
    if (str1 == str2) {
      out.println("true");
    }
    else {
      out.println("false");
    }
  }
}