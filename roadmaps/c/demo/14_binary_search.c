/* 14_binary_search.c — O(log n) search over a sorted array.
 * Build: gcc -std=c11 -Wall -Wextra -Werror 14_binary_search.c -o search
 */
#include <stdio.h>

/* half-open range [lo, hi); returns index or -1 */
long binary_search(const int a[], size_t n, int target) {
    size_t lo = 0, hi = n;
    while (lo < hi) {
        size_t mid = lo + (hi - lo) / 2;   /* midpoint, no overflow */
        if (a[mid] == target) return (long)mid;
        if (a[mid] < target) lo = mid + 1; /* shave the left half */
        else                 hi = mid;     /* shave the right half */
    }
    return -1;                             /* range collapsed: absent */
}

int main(void) {
    int a[] = {2, 4, 6, 8, 10, 12, 14};
    size_t n = sizeof(a) / sizeof(a[0]);
    printf("8  -> index %ld\n", binary_search(a, n, 8));    /* 3 */
    printf("14 -> index %ld\n", binary_search(a, n, 14));   /* 6 */
    printf("7  -> index %ld\n", binary_search(a, n, 7));    /* -1 */
    return 0;
}
