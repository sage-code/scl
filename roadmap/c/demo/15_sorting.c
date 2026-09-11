/* 15_sorting.c — quicksort by hand plus the library qsort.
 * Build: gcc -std=c11 -Wall -Wextra -Werror 15_sorting.c -o sorting
 */
#include <stdio.h>
#include <stdlib.h>

/* partition around the last element; returns the pivot's final slot */
static size_t partition(int a[], size_t lo, size_t hi) {
    int pivot = a[hi];
    size_t i = lo;
    for (size_t j = lo; j < hi; j++) {
        if (a[j] < pivot) {              /* smaller element: move it left */
            int tmp = a[i]; a[i] = a[j]; a[j] = tmp;
            i++;
        }
    }
    int tmp = a[i]; a[i] = a[hi]; a[hi] = tmp;
    return i;
}

static void quicksort(int a[], size_t lo, size_t hi) {
    if (lo >= hi) return;                /* base case: 0 or 1 element */
    size_t p = partition(a, lo, hi);
    if (p > lo) quicksort(a, lo, p - 1); /* guard against size_t underflow */
    quicksort(a, p + 1, hi);
}

/* comparator for the library qsort */
static int cmp_int(const void *a, const void *b) {
    int x = *(const int *)a;
    int y = *(const int *)b;
    return (x > y) - (x < y);            /* portable, cannot overflow */
}

static void print_arr(const char *label, const int a[], size_t n) {
    printf("%s: ", label);
    for (size_t i = 0; i < n; i++) printf("%d ", a[i]);
    printf("\n");
}

int main(void) {
    int a[] = {9, 3, 7, 1, 8, 2};
    size_t n = sizeof(a) / sizeof(a[0]);
    quicksort(a, 0, n - 1);
    print_arr("quicksort", a, n);        /* 1 2 3 7 8 9 */

    int b[] = {42, 7, 3, 99, 1};
    size_t m = sizeof(b) / sizeof(b[0]);
    qsort(b, m, sizeof(int), cmp_int);
    print_arr("qsort", b, m);            /* 1 3 7 42 99 */
    return 0;
}
