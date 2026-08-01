import java.util.stream.IntStream;

public class ArrayStreams {

  public static void main(String[] args) {
    int[] numbers2 = IntStream.rangeClosed(1,10).toArray();
    System.out.println("numbers2:");
    for(int x: numbers2)
       System.out.println(x);
  }
}
