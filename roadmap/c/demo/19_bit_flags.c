/* 19_bit_flags.c — set, clear, toggle, and test bits in a flag word.
 * Build: gcc -std=c11 -Wall -Wextra -Werror 19_bit_flags.c -o flags
 */
#include <stdio.h>

#define FLAG_A (1u << 0)   /* 0001 */
#define FLAG_B (1u << 1)   /* 0010 */
#define FLAG_C (1u << 2)   /* 0100 */

int main(void) {
    unsigned flags = 0;

    flags |= FLAG_A;          /* set:   OR the bit on */
    flags |= FLAG_C;
    flags &= ~FLAG_A;         /* clear: AND with the inverted bit */
    flags ^= FLAG_B;          /* toggle: XOR flips the bit */

    printf("flags = 0x%x\n", flags);          /* 0x6: bits B and C */

    if (flags & FLAG_B)       /* test: AND is nonzero when the bit is set */
        printf("FLAG_B is set\n");
    if (flags & FLAG_A)
        printf("FLAG_A is set\n");            /* not printed: A was cleared */
    return 0;
}
