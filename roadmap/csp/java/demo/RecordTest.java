public class RecordTest {
  public static void main(String args[]) {
    var r = new Rectangle(2,4);
    System.out.println(r.getArea());
  }
}

record Rectangle(double length, double width){

  Rectangle {
    if (length <= 0 || width <= 0) {
        throw new IllegalArgumentException(
        String.format("Invalid dimensions: %f, %f", length, width));
    }
  }

  public double getArea() {
    return (length * width);
  }
};
