/* 06_functions.c — prototypes, call-by-value, recursion.
 * Build: gcc -std=c11 -Wall -Wextra -Werror 06_functions.c -o functions
 */
#include <stdio.h>

/* prototype: promises this exact signature before main() calls it */
unsigned long factorial(unsigned int n);

/* call-by-value: parameters are copies; caller's data is untouched */
int increment(int x) {
    return x + 1;
}

int main(void) {
    int v = 5;
    printf("increment(%d) = %d, v is still %d\n", v, increment(v), v);

    for (unsigned int i = 0; i <= 10; i++) {
        printf("%2u! = %lu\n", i, factorial(i));
    }
    return 0;
}

/* definition: fulfills the promise. Recursion: base case + step */
unsigned long factorial(unsigned int n) {
    if (n <= 1) {
        return 1;                  /* base case stops the recursion */
    }
    return n * factorial(n - 1);   /* recursive call with a smaller n */
}
