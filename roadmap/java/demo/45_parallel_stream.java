/* Java lab demo 45 — a parallel stream spread over the common pool.
 *
 * Run:  javac 45_parallel_stream.java  &&  java StreamPara
 */
import java.util.*;

class StreamPara {

  public static void main(String args[]) {
    List<Integer> listOfNumbers = new LinkedList<Integer>();
    for (Integer i=0; i < 20; i++) {
      listOfNumbers.add(i);
    }
    listOfNumbers.parallelStream().forEach(
      number -> System.out.println(
        number + " " + Thread.currentThread().getName()
      )
    );
  }
}