/* Java lab demo 38 — ArrayList filled and printed with a stream.
 *
 * Run:  javac 38_array_list_stream.java  &&  java ArrayListTest
 */
import java.util.ArrayList;
import java.util.stream.IntStream;;

class ArrayListTest {
  public static void main(String[] args) {
    ArrayList<Integer> ali = new ArrayList<>();
    IntStream.rangeClosed(1,10).forEach(x -> ali.add(x));
    ali.forEach(x -> System.out.println(x));
  }
}
