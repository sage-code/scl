import java.util.LinkedList;
import java.util.Iterator;
public class LinkedListTest {
  public static void main(String[] args) {
    var ali = new LinkedList<Integer>();
    //append elements
    for (int i = 1; i<=10; i++) ali.add(i);
    //remove elements
    Integer  e ;
    e = ali.getFirst();
    ali.remove(e);
    //display odd elements
    Iterator<Integer> it = ali.iterator();
    while (it.hasNext()) {
      e = it.next();
      if (e%2 == 0) System.out.println(e);;
    }
  }
}
