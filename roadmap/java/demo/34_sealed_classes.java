/* Java lab demo 34 — sealed classes and the permitted hierarchy.
 *
 * Run:  javac 34_sealed_classes.java  &&  java Figure
 */

sealed class Figure
  permits Circle, Square, Rectangle
{
  // Sealed types tell the compiler every direct subtype, so a switch over
  // Figure can be checked. Square is deliberately declared `non-sealed`, so
  // it remains open for extension and the compiler still demands a default
  // branch. Take `non-sealed` away and the default becomes unreachable code.
  static String describe(Figure f) {
    return switch (f) {
      case Circle c    -> "circle r=" + c.radius;
      case Square s    -> "square side=" + s.side;
      case Rectangle r -> "rectangle " + r.length + "x" + r.width;
      default          -> "other figure";
    };
  }

  public static void main(String[] args) {
    System.out.println(describe(new Circle()));
    System.out.println(describe(new Square()));
    System.out.println(describe(new Rectangle()));
  }
}

final class Circle extends Figure {
    float radius;
}
non-sealed class Square extends Figure {
    float side;
}
sealed class Rectangle extends Figure {
    float length, width;
}
final class FilledRectangle extends Rectangle {
    int red, green, blue;
}
