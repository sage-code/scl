/* 17_sieve.c — Sieve of Eratosthenes: all primes up to a limit.
 * Build: gcc -std=c11 -Wall -Wextra -Werror 17_sieve.c -o sieve
 */
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>

void sieve(unsigned int limit) {
    /* composite[i] true means i is known to be non-prime */
    bool *composite = calloc(limit + 1, sizeof(bool));
    if (composite == NULL) {
        fprintf(stderr, "calloc failed\n");
        return;
    }
    for (unsigned int p = 2; p * p <= limit; p++) {  /* p only to sqrt */
        if (!composite[p]) {                         /* p is still prime */
            for (unsigned int m = p * p; m <= limit; m += p) {
                composite[m] = true;                 /* mark its multiples */
            }
        }
    }
    for (unsigned int i = 2; i <= limit; i++) {
        if (!composite[i]) printf("%u ", i);
    }
    printf("\n");
    free(composite);
}

int main(void) {
    printf("primes up to 50: ");
    sieve(50);                       /* 2 3 5 7 11 13 17 19 23 29 31 37 41 43 47 */
    return 0;
}
