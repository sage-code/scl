/* 01_hello.c — first program.
 * Build: gcc -std=c11 -Wall -Wextra -Werror 01_hello.c -o hello
 * Run:   ./hello   (Windows: ./hello.exe)
 */
#include <stdio.h>   /* declares printf() */

int main(void) {     /* entry point; "void" = no arguments */
    /* printf writes the format string to stdout; \n ends the line */
    printf("Hello, C!\n");
    return 0;        /* exit status 0 tells the shell: success */
}
