/* 18_callbacks.c — function pointers: one loop, many policies.
 * Build: gcc -std=c11 -Wall -Wextra -Werror 18_callbacks.c -o callbacks
 */
#include <stdio.h>

/* the callback type: takes an int, returns an int verdict (nonzero = stop) */
typedef int (*Predicate)(int);

/* generic scan: run the callback over the array until it says stop */
int scan(const int a[], size_t n, Predicate p) {
    for (size_t i = 0; i < n; i++) {
        int verdict = p(a[i]);
        if (verdict != 0) return verdict;
    }
    return 0;
}

static int is_odd(int v)  { return v % 2; }
static int is_even(int v) { return !(v % 2); }
static int over_ten(int v){ return v > 10; }

int main(void) {
    int a[] = {2, 4, 5, 8, 12};
    printf("first odd:     %d\n", scan(a, 5, is_odd));    /* 5  */
    printf("first even:    %d\n", scan(a, 5, is_even));   /* 2  */
    printf("first over 10: %d\n", scan(a, 5, over_ten));  /* 12 */
    return 0;
}
