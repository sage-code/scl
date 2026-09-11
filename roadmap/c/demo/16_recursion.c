/* 16_recursion.c — naive Fibonacci versus memoized Fibonacci.
 * Build: gcc -std=c11 -Wall -Wextra -Werror 16_recursion.c -o recursion
 */
#include <stdio.h>

/* exponential: recomputes the same subtrees over and over */
unsigned long fib_slow(unsigned int n) {
    if (n < 2) return n;
    return fib_slow(n - 1) + fib_slow(n - 2);
}

/* O(n): every value is computed once, then reused from the memo table */
unsigned long fib_fast(unsigned int n) {
    static unsigned long memo[100] = {0, 1};   /* persists across calls */
    if (n < 2) return n;
    if (memo[n] != 0) return memo[n];          /* already known: reuse */
    memo[n] = fib_fast(n - 1) + fib_fast(n - 2);
    return memo[n];
}

int main(void) {
    for (unsigned int i = 0; i <= 45; i++) {
        printf("fib(%2u) = %lu\n", i, fib_fast(i));
    }
    /* fib_slow(40) alone would take many seconds — fib_fast is instant */
    return 0;
}
