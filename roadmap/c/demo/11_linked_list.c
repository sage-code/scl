/* 11_linked_list.c — singly linked list: push, print, free.
 * Build: gcc -std=c11 -Wall -Wextra -Werror 11_linked_list.c -o list
 */
#include <stdio.h>
#include <stdlib.h>

typedef struct Node Node;
struct Node {
    int  value;
    Node *next;                          /* NULL = end of the list */
};

Node *list_push(Node *head, int value) { /* O(1) insertion at the front */
    Node *n = malloc(sizeof(Node));
    if (n == NULL) return head;
    n->value = value;
    n->next = head;
    return n;
}

void list_print(const Node *head) {
    for (const Node *cur = head; cur != NULL; cur = cur->next) {
        printf("%d -> ", cur->value);
    }
    printf("NULL\n");
}

void list_free(Node *head) {
    while (head != NULL) {
        Node *next = head->next;         /* save next BEFORE freeing */
        free(head);
        head = next;
    }
}

int main(void) {
    Node *head = NULL;
    head = list_push(head, 3);
    head = list_push(head, 2);
    head = list_push(head, 1);
    list_print(head);                    /* 1 -> 2 -> 3 -> NULL */
    list_free(head);
    return 0;
}
