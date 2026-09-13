/* Java lab demo 21 — the switch expression (Java 14+).
 *
 * Unlike the classic switch statement, a switch expression RETURNS a value.
 * It uses arrow labels, so there is no fall-through and no break, and it must
 * be exhaustive. DayOfWeek is an enum: listing every constant lets the
 * compiler prove the expression always produces a value.
 *
 * Run:  javac 21_switch_expression.java  &&  java SwitchXP
 */
import java.time.DayOfWeek;
import java.time.LocalDate;

class SwitchXP {
  public static void main(String[] args) {
    DayOfWeek day = LocalDate.now().getDayOfWeek();

    // Every enum constant is covered, so no default branch is required.
    boolean isWeekend = switch (day) {
      case MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY -> false;
      case SATURDAY, SUNDAY                             -> true;
    };

    System.out.println("Today is " + day);
    System.out.println(isWeekend ? "Have a nice weekend" : "Have a nice day");
  }
}
