/* Java lab demo 42 — HashSet: duplicates are dropped.
 *
 * Run:  javac 42_hash_set.java  &&  java SetClass
 */
import java.util.*;
class SetClass {
  public static void main (String[] args) {
    Integer[] src = {8,1,3,5};
    HashSet<Integer> set = new
      HashSet<>(Arrays.asList(src));
    for (int i = 0; i<5; i++) set.add(i);
    for (var e : set) {
        System.out.println(e);
    };
  }
}
