#include <stdio.h>
#include <string.h>

int main () {
    char a[] = "hello ";
    char b[] = "world!";
    char c[13];

    strcat(c, a);
    strcat(c, b);
    printf("c = %s\n", c);
    return 0;
}