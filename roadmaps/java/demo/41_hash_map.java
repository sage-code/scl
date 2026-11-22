/* Java lab demo 41 — HashMap key/value pairs.
 *
 * Run:  javac 41_hash_map.java  &&  java MapClass
 */
import java.util.*;
class MapClass {
  public static void main (String[] args) {
    Map<String, Integer> map = new HashMap<String, Integer>();
    map.put("x",1);
    map.put("y",2);
    map.put("z",3);

    var keys = map.keySet();
    for (var e : keys) {
        System.out.println(e+":"+map.get(e));
    };
  }
}
