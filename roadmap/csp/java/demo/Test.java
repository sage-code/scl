package test;

public class Test {
   public static void hello() {
      System.out.println("hello from package test");
   }
}

import test.*;

class Main {
  public static void main(String[] args) {
    Test.hello();
  }
}