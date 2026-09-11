/* 12_dynamic_array.c — growable Vector: push, lookup, free.
 * Build: gcc -std=c11 -Wall -Wextra -Werror 12_dynamic_array.c -o vector
 */
#include <stdio.h>
#include <stdlib.h>

typedef struct {
    int   *data;
    size_t len;                          /* elements in use */
    size_t cap;                          /* allocated capacity */
} Vector;

/* append with geometric growth: amortized O(1) per push */
int vec_push(Vector *v, int value) {
    if (v->len == v->cap) {
        size_t new_cap = v->cap ? v->cap * 2 : 4;   /* 0 -> 4, then double */
        int *grown = realloc(v->data, new_cap * sizeof(int));
        if (grown == NULL) return -1;               /* old buffer intact */
        v->data = grown;
        v->cap = new_cap;
    }
    v->data[v->len++] = value;
    return 0;
}

void vec_free(Vector *v) {
    free(v->data);
    v->data = NULL;
    v->len = v->cap = 0;
}

int main(void) {
    Vector v = {0};
    if (vec_push(&v, 10) != 0) return 1;
    vec_push(&v, 20);
    vec_push(&v, 30);
    for (size_t i = 0; i < v.len; i++) {
        printf("%d ", v.data[i]);        /* 10 20 30 */
    }
    printf("\n");
    vec_free(&v);
    return 0;
}
