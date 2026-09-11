/* 13_hash_table.c — string keys, bucket chaining, djb2 hash.
 * Build: gcc -std=c11 -Wall -Wextra -Werror 13_hash_table.c -o hash
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define BUCKETS 8

typedef struct Entry Entry;
struct Entry {
    char  key[32];                       /* copy of the key string */
    int   value;
    Entry *next;                         /* chain for collisions */
};

/* djb2: fast, well-distributed string hash */
static unsigned long hash_str(const char *s) {
    unsigned long h = 5381;
    while (*s) h = h * 33 + (unsigned char)*s++;
    return h;
}

/* find-or-create the entry for a key inside its bucket chain */
static Entry *entry_for(Entry *table[], const char *key) {
    unsigned long idx = hash_str(key) % BUCKETS;
    Entry **slot = &table[idx];
    for (Entry *e = *slot; e != NULL; e = e->next) {
        if (strcmp(e->key, key) == 0) return e;   /* already present */
    }
    Entry *e = calloc(1, sizeof(Entry));          /* new key: prepend */
    if (e == NULL) return NULL;
    snprintf(e->key, sizeof(e->key), "%s", key);
    e->next = *slot;
    *slot = e;
    return e;
}

void table_put(Entry *table[], const char *key, int value) {
    Entry *e = entry_for(table, key);
    if (e) e->value = value;
}

int table_get(Entry *table[], const char *key, int *out) {
    Entry *e = entry_for(table, key);
    if (e == NULL) return 0;             /* not found */
    *out = e->value;
    return 1;
}

int main(void) {
    Entry *table[BUCKETS] = {0};
    table_put(table, "ada", 1);
    table_put(table, "bob", 2);
    int v = 0;
    if (table_get(table, "ada", &v)) printf("ada -> %d\n", v);
    if (table_get(table, "zed", &v)) printf("zed -> %d\n", v);  /* absent */
    else printf("zed not found\n");
    return 0;
}
