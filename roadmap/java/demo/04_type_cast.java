/* Java lab demo 04 — implicit widening and explicit narrowing casts.
 *
 * Run:  javac 04_type_cast.java  &&  java TypeCast
 */
class TypeCast {
    public static void main(String[] args) {
      /* implicit casting initialization */
      long   x = 10L;  // No casting involved
      double y = x;    // Automatic casting

      // test automatic casting
      System.out.println(x);   // Outputs 10
      System.out.println(y);   // Outputs 10.0

      /* explicit casting initialization*/
      double demoDob = 30.42d;
      int    demoInt = (int)demoDob; // Explicit casting

      // test explicit casting
      System.out.println(demoDob);   // Outputs 30.42
      System.out.println(demoInt);   // Outputs 30
    }
}
