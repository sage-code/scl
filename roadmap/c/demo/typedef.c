#include <stdio.h>

typedef struct {
   unsigned int one;
   unsigned int two;
   unsigned int three;
} Mask;

int main( ) {

   Mask b;
   b.one   = 100;
   b.two   = 200;
   b.three = 300;

   printf( "b.one = %i\n",   b.one);  // 100
   printf( "b.two = %i\n",   b.two);  // 200
   printf( "b.three = %i\n", b.three);// 300

   return 0;
}