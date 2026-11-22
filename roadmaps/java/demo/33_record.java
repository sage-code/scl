/* Java lab demo 33 — records (Java 16+).
 *
 * A record is a compact, immutable data carrier. The compiler generates the
 * canonical constructor, the accessors, and equals(), hashCode() and
 * toString() from the component list. A compact constructor runs extra
 * validation before the fields are assigned — the right place for invariants.
 *
 * Run:  javac 33_record.java  &&  java RecordTest
 */
class RecordTest {
  public static void main(String[] args) {
    var r = new Dimension(2, 4);
    System.out.println(r);                      // toString() is generated
    System.out.println("area = " + r.area());

    // The invariant is enforced by the compact constructor.
    try {
      new Dimension(-1, 4);
    } catch (IllegalArgumentException e) {
      System.out.println("Rejected: " + e.getMessage());
    }
  }
}

// Components length and width are final; the accessors are named after them.
record Dimension(double length, double width) {

  // Compact constructor: no parameter list, the components are in scope.
  Dimension {
    if (length <= 0 || width <= 0) {
      throw new IllegalArgumentException(
        String.format("invalid dimensions: %f, %f", length, width));
    }
  }

  // Records may still declare extra behaviour.
  double area() {
    return length * width;
  }
}
