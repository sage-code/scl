import java.util.Scanner;

/* demo switch statement */
class Switch {

public static void  main(String args[]) {
  Scanner sc = new Scanner(System.in);
  System.out.print("enter grade:");
  String str = sc.next();
  char grade = str.charAt(0);
  sc.close();
  switch (grade) {
    case 'A' :
      print("Congratulation! ");
      print("You have passed. ");
      break;
    case 'B':
  case 'C': case 'D':
      print("You have passed." );
      break;
    case 'F' :
      print("You have failed" );
      break;
    default:
      print("Invalid grade" );
  }
}

private static void print(String str){
   System.out.println(str);
}
}