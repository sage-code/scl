public class ArraysTest {

  public static void main(String[] args) {
    int[] numbers; //NULL array

    numbers = new int[10];

    for (int i = 0; i<10; i++) {
      numbers[i] = i+1;
    }
    System.out.println("first:"  + numbers[0]);
    System.out.println("second:" + numbers[9]);
  }

}
