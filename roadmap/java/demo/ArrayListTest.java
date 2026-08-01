import java.util.ArrayList;
import java.util.stream.IntStream;;

public class ArrayListTest {
  public static void main(String[] args) {
    ArrayList<Integer> ali = new ArrayList<>();
    IntStream.rangeClosed(1,10).forEach(x -> ali.add(x));
    ali.forEach(x -> System.out.println(x));
  }
}
