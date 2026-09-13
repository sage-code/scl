/* Java lab demo 28 — reference semantics: an array element as an output parameter.
 *
 * Run:  javac 28_io_parameters.java  &&  java InputOutput
 */
class InputOutput {

    //input & output parameter
    private static void increment(Integer[] x) {
      x[0] += 1;
    }

    public static void main(String args[]) {
      Integer[] x = {0}; //array
      increment(x);
      System.out.println(" x = " + x[0]);
    }
}
