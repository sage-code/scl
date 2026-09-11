/* 20_file_io.c — write a file, read it back, and report errors via errno.
 * Build: gcc -std=c11 -Wall -Wextra -Werror 20_file_io.c -o fileio
 */
#include <errno.h>
#include <stdio.h>
#include <string.h>   /* strerror */

int main(void) {
    /* write phase: "w" truncates or creates */
    FILE *out = fopen("notes.txt", "w");
    if (out == NULL) {
        fprintf(stderr, "open for write failed: %s\n", strerror(errno));
        return 1;
    }
    fprintf(out, "line one\nline two\n");
    fclose(out);

    /* read phase: line by line, with a bounds-checked reader */
    FILE *in = fopen("notes.txt", "r");
    if (in == NULL) {
        perror("notes.txt");           /* prefix + strerror(errno) */
        return 1;
    }
    char buf[256];
    while (fgets(buf, sizeof(buf), in) != NULL) {
        printf("read: %s", buf);
    }
    fclose(in);

    /* demonstrate a missing file: errno gets set, we read it */
    errno = 0;                          /* reset BEFORE the risky call */
    if (fopen("no_such_file.txt", "r") == NULL) {
        printf("missing file errno=%d (%s)\n", errno, strerror(errno));
    }
    return 0;
}
