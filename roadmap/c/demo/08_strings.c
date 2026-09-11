/* 08_strings.c — the NUL-terminated model and the safe copy idiom.
 * Build: gcc -std=c11 -Wall -Wextra -Werror 08_strings.c -o strings
 */
#include <stdio.h>
#include <string.h>   /* strlen, strncpy */

int main(void) {
    char msg[] = "Hello";          /* 6 bytes: 5 letters + NUL */
    printf("strlen = %zu, sizeof = %zu\n", strlen(msg), sizeof(msg));

    /* SAFE copy: never write more than size-1, then force the NUL */
    char copy[8];
    strncpy(copy, "safety first, but truncated here", sizeof(copy) - 1);
    copy[sizeof(copy) - 1] = '\0'; /* strncpy may have omitted the NUL */

    printf("copy   = '%s'\n", copy);

    /* modify a writable array (never a string literal) */
    copy[0] = 'S';
    printf("copy   = '%s'\n", copy);
    return 0;
}
