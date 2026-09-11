/* 03_operators.c — arithmetic, modulo, and compound assignment.
 * Build: gcc -std=c11 -Wall -Wextra -Werror 03_operators.c -o operators
 */
#include <stdio.h>

int main(void) {
    int a = 17, b = 5;
    printf("a + b = %d\n", a + b);       /* 22 */
    printf("a - b = %d\n", a - b);       /* 12 */
    printf("a * b = %d\n", a * b);       /* 85 */
    printf("a / b = %d\n", a / b);       /* 3   integer division truncates */
    printf("a %% b = %d\n", a % b);      /* 2   the remainder  */

    int total = 10;
    total += 5;                          /* compound assignment: total = 15 */
    printf("total = %d\n", total);

    /* mixed math: cast BEFORE division keeps the fraction */
    double ratio = (double)a / b;
    printf("ratio = %.2f\n", ratio);     /* 3.40 */
    return 0;
}
