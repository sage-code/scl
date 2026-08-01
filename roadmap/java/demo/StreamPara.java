import java.util.*;

public class StreamPara {

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