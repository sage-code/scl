class ForLoop {

public static void main(String[] args) {
  // generate prime numbers < 30
  for (int i = 1; i < 30; i++) {
    for (int j = 2; j < i; j++) {
      if (i % j  == 0) {
        break;
      };
      if (j == i-1) {
          System.out.print(i);
          System.out.print(", ");
      };
    };
  }//end for
  System.out.println("\ndone!");
}
}
