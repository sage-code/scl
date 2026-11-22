/* Java lab demo 40 — the forEach terminal operation.
 *
 * Run:  javac 40_for_each.java  &&  java ForEach
 */
import java.util.LinkedList;
class ForEach {
   public static void main(String[] args) {

    var ls = new LinkedList<Integer>();

    //populate the list
    for (int i = 0; i<10; i++) ls.add((Integer)i);

    //multiply each member with 2
    ls.forEach( x -> ls.set(x,x*2));

    //list all members
    ls.forEach( x -> System.out.println(x));
   }
}