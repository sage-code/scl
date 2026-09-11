/* 09_dynamic_memory.c — calloc, realloc, free with full failure checks.
 * Build: gcc -std=c11 -Wall -Wextra -Werror 09_dynamic_memory.c -o memory
 */
#include <stdio.h>
#include <stdlib.h>   /* calloc, realloc, free */

int main(void) {
    size_t n = 5;
    int *arr = calloc(n, sizeof(int));   /* zero-initialized */
    if (arr == NULL) {
        fprintf(stderr, "allocation failed\n");
        return 1;
    }
    for (size_t i = 0; i < n; i++) {
        arr[i] = (int)(i + 1) * 10;      /* 10 20 30 40 50 */
    }

    size_t bigger = 8;
    int *grown = realloc(arr, bigger * sizeof(int));
    if (grown == NULL) {                 /* failure: arr is still valid */
        free(arr);                       /* release the original block */
        return 1;
    }
    arr = grown;                         /* take ownership of the new block */
    for (size_t i = n; i < bigger; i++) {
        arr[i] = 0;                      /* new slots: initialize them */
    }
    for (size_t i = 0; i < bigger; i++) {
        printf("%d ", arr[i]);
    }
    printf("\n");
    free(arr);                           /* one free per allocation */
    return 0;
}
