/* Java lab demo 19 — the do/while loop, which runs its body at least once.
 *
 * Run:  javac 19_do_while.java  &&  java DoWhile
 */
class DoWhile {

  public static void main(String[] args) {
    int eggs = 12;
    int eggsThrown = 1;
    do {
      System.out.println(
        "The egg #" +
        Integer.toString(eggsThrown)   +
        " hits the Neighbors house.");
      eggsThrown++;
    } while (eggsThrown <= eggs);
  }
}
