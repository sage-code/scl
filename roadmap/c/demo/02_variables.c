/* 02_variables.c — types and sizeof.
 * Build: gcc -std=c11 -Wall -Wextra -Werror 02_variables.c -o variables
 */
#include <stdint.h>    /* fixed-width types */
#include <stdio.h>

int main(void) {
    int       age    = 30;            /* signed 32-bit integer */
    double    height = 1.82;          /* double precision float */
    char      letter = 'A';           /* one character */
    uint32_t  count  = 65535U;        /* exactly 32 unsigned bits */
    /* size_t is the natural type for sizes - %zu prints it */
    printf("int:   %d\n", age);
    printf("double:%.2f\n", height);
    printf("char:  %c\n", letter);
    printf("uint32:%u\n", count);
    printf("sizeof(int)  = %zu bytes\n", sizeof(int));
    printf("sizeof(double)= %zu bytes\n", sizeof(double));
    return 0;
}
