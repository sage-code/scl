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
