/* Java lab demo 35 — local variable type inference (`var`, Java 10+).
 *
 * `var` asks the compiler to infer the type of a local variable from the
 * initialiser. The language stays statically typed: the type is fixed at
 * compile time and every check still applies. `var` cannot be used without an
 * initialiser, for fields, or for method parameters.
 *
 * Run:  javac 35_type_inference.java  &&  java TypeInference
 */
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedList;

class TypeInference {
  public static void main(String[] args) {
    // The initialiser on the right decides the type on the left.
    var list = new ArrayList<String>();           // ArrayList<String>
    list.add("alpha");
    list.add("beta");

    var stream = list.stream();                   // Stream<String>
    System.out.println("upper: " + stream.map(String::toUpperCase).toList());

    // Nested generics are the case that made `var` worth having: the type
    // appears once instead of twice.
    var index = new HashMap<String, LinkedList<Integer>>();
    index.computeIfAbsent("alpha", k -> new LinkedList<>()).add(1);
    index.computeIfAbsent("beta",  k -> new LinkedList<>()).add(2);
    System.out.println("index: " + index);

    // A loop over a map is the other place where the type is noise.
    for (var entry : index.entrySet()) {
      System.out.println(entry.getKey() + " -> " + entry.getValue());
    }
  }
}
