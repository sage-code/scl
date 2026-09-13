/* Java lab demo 16 — arrays and the Scanner class (interactive).
 *
 * Read an integer, split it into digits, then find the largest and the
 * smallest digit. Three passes: one to count the digits so the array can be
 * sized exactly, one to fill it, one to compare. Math.abs() matters, because
 * digit extraction on a negative number would keep the sign.
 *
 * Run:  javac 16_max_min_digit.java  &&  java MaxMinDigit
 */
import java.util.Arrays;
import java.util.Scanner;

class MaxMinDigit {
  public static void main(String[] args) {
    Scanner input = new Scanner(System.in);

    System.out.print("Enter an integer: ");
    int value = Math.abs(input.nextInt());
    input.close();

    // Pass 1 — count the digits; 0 still has one digit.
    int count = 0;
    for (int rest = value; rest > 0; rest /= 10) {
      count++;
    }
    if (count == 0) {
      count = 1;
    }

    // Pass 2 — store every digit, least significant first.
    int[] digits = new int[count];
    int rest = value;
    for (int i = 0; i < digits.length; i++) {
      digits[i] = rest % 10;
      rest /= 10;
    }

    // Pass 3 — running maximum and minimum, starting from the first digit.
    int largest = digits[0];
    int smallest = digits[0];
    for (int i = 1; i < digits.length; i++) {
      if (digits[i] > largest) {
        largest = digits[i];
      }
      if (digits[i] < smallest) {
        smallest = digits[i];
      }
    }

    System.out.println("Digits:    " + Arrays.toString(digits));
    System.out.println("Max digit: " + largest);
    System.out.println("Min digit: " + smallest);
  }
}
