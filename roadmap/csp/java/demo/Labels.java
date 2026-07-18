public class Labels {
/* demonstrate break and continue with label */
  public static void main(String[] args) {
    //fixture string for searched
    String searchMe = "Look for a substring inside this text";

    //string to be searched in fixture
    String substring = "inside";
    boolean foundIt = false;

    int max = searchMe.length() -
              substring.length();

    // outer loop (has a label "out")
    out: for (int i = 0; i <= max; i++) {
        int n = substring.length();
        int j = i;
        int k = 0;
        // inner loop (does not have a label)
        while (n-- != 0) {
            if (searchMe.charAt(j++) != substring.charAt(k++)) {
                continue out;
            }
        }
        foundIt = true;
        break out;
    }
    System.out.println(foundIt ? "Found it" : "Didn't find it");
  }

}
