/* 07_pointers.c — addresses, dereferencing, pointer arithmetic.
 * Build: gcc -std=c11 -Wall -Wextra -Werror 07_pointers.c -o pointers
 */
#include <stdio.h>

int main(void) {
    int x = 42;
    int *p = &x;                   /* p stores the address of x */

    printf("x     = %d\n", x);
    printf("&x    = %p\n", (void *)&x);   /* the address itself */
    printf("*p    = %d\n", *p);           /* dereference: the value there */

    *p = 99;                       /* write THROUGH the pointer */
    printf("x now = %d\n", x);     /* 99 — x changed via p */

    /* pointer arithmetic: p + 1 advances one int (4 bytes) */
    int arr[3] = {10, 20, 30};
    int *q = arr;                  /* array name decays to &arr[0] */
    printf("first  = %d\n", *q);
    printf("second = %d\n", *(q + 1));   /* q+1: next int, not next byte */
    printf("third  = %d\n", q[2]);       /* q[i] is *(q + i) */
    return 0;
}
