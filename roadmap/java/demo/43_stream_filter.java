/* Java lab demo 43 — a stream pipeline with filter and a method reference.
 *
 * Run:  javac 43_stream_filter.java  &&  java FilterTest
 */
import java.util.*;
class FilterTest {
    // Driver code
    public static void main(String[] args)
    {
        // Creating a list of Integers
        List<Integer> list = Arrays.asList(3, 4, 6, 12, 20);

        // elements that are divisible by 5
        list.stream().filter (
             num -> num % 2 == 0).forEach(System.out::println);
    }
}
