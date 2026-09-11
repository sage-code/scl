/* 10_struct_union.c — structs, unions, enums, and field access.
 * Build: gcc -std=c11 -Wall -Wextra -Werror 10_struct_union.c -o structs
 */
#include <stdio.h>

struct Point { int x, y; };              /* a small data shape */

union Value {                            /* overlapping storage */
    int   i;
    float f;
};

enum Color { RED, GREEN, BLUE };         /* named integer constants */

int main(void) {
    struct Point p = {3, 7};             /* positional init */
    p.x = 5;                             /* mutate a field */
    printf("p = (%d, %d)\n", p.x, p.y);

    union Value v;
    v.i = 42;                            /* write the int member */
    printf("v.i = %d\n", v.i);
    v.f = 3.14f;                         /* same bytes now read as float */
    printf("v.f = %f (i is gone)\n", v.f);

    enum Color c = BLUE;
    printf("BLUE = %d\n", c);            /* 2 */
    printf("sizeof(union Value) = %zu\n", sizeof(union Value)); /* 4 */
    return 0;
}
