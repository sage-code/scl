/* Java lab demo 06 — printf formatting with an argument index and a type specifier.
 *
 * Run:  javac 06_printf_format.java  &&  java PrintfDemo
 */
class PrintfDemo {
    // java main method is mandatory
    public static void main(String args[]) {
        System.out.printf("Hello, %1$b %n", true);
    }
}