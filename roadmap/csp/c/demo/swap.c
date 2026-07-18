#include <stdio.h>
void swap(int *x, int *y) {
   register int t; //temporary value
   t = *y; *y = *x; *x = t;
}

void swap_test () {
   int a = 1, b = 2;
   printf("before\n");
   printf("a = %d b = %d \n",a,b);
   //function call
   swap(&a, &b);
   printf("after\n");
   printf("a = %d b = %d \n", a, b);
}