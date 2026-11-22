/* 05_loops.c — for, while, do-while, break and continue.
 * Build: gcc -std=c11 -Wall -Wextra -Werror 05_loops.c -o loops
 */
#include <stdio.h>

int main(void) {
    /* for: counted repetition */
    int sum = 0;
    for (int i = 1; i <= 10; i++) {
        sum += i;
    }
    printf("sum 1..10 = %d\n", sum);          /* 55 */

    /* while: pre-test — may run zero times */
    int n = 3;
    while (n > 0) {
        printf("t-minus %d\n", n--);
    }

    /* do-while: post-test — body always runs once */
    int tries = 0;
    do {
        tries++;
    } while (tries < 3);

    /* break aborts; continue skips to the next iteration */
    for (int i = 1; i <= 6; i++) {
        if (i % 2 == 0) {
            continue;              /* skip even numbers */
        }
        if (i > 5) {
            break;                 /* stop at 6 */
        }
        printf("odd: %d\n", i);    /* 1 3 5 */
    }
    return 0;
}
