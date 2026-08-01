import java.util.ArrayList;
import java.util.Iterator;
public class ArrayListClassic {
  public static void main(String[] args) {
    ArrayList<Integer> ali = new ArrayList<>();
    //append elements
    for (int i = 1; i<=10; i++) ali.add(i);
    //remove elements
    Integer  e ;
    e = ali.get(0);
    ali.remove(e);
    //display odd elements
    Iterator<Integer> it = ali.iterator();
    while (it.hasNext()) {
      e = it.next();
      if (e%2 == 0) System.out.println(e);;
    }
  }
}
