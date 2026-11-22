/* Java lab demo 07 — building output with System.out.format.
 *
 * Run:  javac 07_string_format.java  &&  java Strings
 */
class Strings {

public static void
  main(String[] args) {
  /* printing a string */
  int year = 2022;
  System.out.format("Copyright (c) " +
                    "Sage-Code: %d%n",
                    year);
}
}
