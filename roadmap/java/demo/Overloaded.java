public class Overloaded {

  class Multiply{
    static int mul(int a,int b){
      return a * b;
    }

    static int mul(int a,int b,int c) {
      return a * b * c;
    }
  }
  public static void main(String[] args){
    System.out.println(Multiply.mul(1,2));
    System.out.println(Multiply.mul(1,2,3));
  }
}
