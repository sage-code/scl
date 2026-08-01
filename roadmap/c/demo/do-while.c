#include <stdio.h>
int main () {
   int x = 1;
   do {
      x = x + 1;
   } while (x < 4);
   printf("x = %d", x);
   return 0;
}
