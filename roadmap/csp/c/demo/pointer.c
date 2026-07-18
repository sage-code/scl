#include <stdio.h>

void ptr_test () {

   int     y = 2020; // an integer
   int    *p = &y;   // a pointer
   float  *q = NULL; // NULL pointer

   printf("Value of  p: %0X\n", p );
   printf("Value of *p: %d\n", *p );
   printf("Value of  q: %d\n", q  );
}

//Output:
/*
Value of  p: 49334BEC
Value of *p: 2020
Value of  q: 0
*/