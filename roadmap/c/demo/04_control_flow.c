/* 04_control_flow.c — if/else-if chains and switch.
 * Build: gcc -std=c11 -Wall -Wextra -Werror 04_control_flow.c -o control
 */
#include <stdio.h>

int main(void) {
    int grade = 87;

    if (grade >= 90) {
        printf("A\n");
    } else if (grade >= 80) {      /* tested only when the first fails */
        printf("B\n");
    } else {
        printf("below B\n");
    }

    char letter = 'B';
    switch (letter) {
        case 'A':
            printf("excellent\n");
            break;                 /* break prevents fall-through */
        case 'B':
            printf("good\n");
            break;
        case 'C':
        case 'D':                  /* shared body: C or D */
            printf("passing\n");
            break;
        default:
            printf("unknown\n");
            break;
    }
    return 0;
}
