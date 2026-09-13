/* Java lab demo 14 — generate an array from an IntStream range.
 *
 * Run:  javac 14_array_streams.java  &&  java ArrayStreams
 */
import java.util.stream.IntStream;

class ArrayStreams {

  public static void main(String[] args) {
    int[] numbers2 = IntStream.rangeClosed(1,10).toArray();
    System.out.println("numbers2:");
    for(int x: numbers2)
       System.out.println(x);
  }
}
