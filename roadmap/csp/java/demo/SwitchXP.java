/* Read day of week in Java 
   https://docs.oracle.com/javase/8/docs/api/java/time/DayOfWeek.html
*/
import java.time.DayOfWeek
import java.util.Calendar;

public class SwitchXP {
  public static void main(String args[]) {
    Calendar calendar = Calendar.getInstance();
    int today = calendar.get(Calendar.DAY_OF_WEEK);
    var day = DayOfWeek.of(today);
    var isWeekend = switch (day) {
            case  MONDAY, 
                  TUESDAY, 
                  WEDNESDAY, 
                  THURSDAY, 
                  FRIDAY       -> false;
            case  SUNDAY       -> true;
            case  SATURDAY     -> true;
            default -> throw new IllegalStateException("Invalid day: " + day);
    };
    if (isWeekend) System.out.println("Have a nice weekend");
    else System.out.println("Have a nice day");
  }
}