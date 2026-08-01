#include <stdio.h>

void main () {
   char result;
   printf("your grade:>");
   scanf(" %c",&result);
   if (result == 'A')
         printf("Congratulation, you passed!\n");
   else if (result == 'B' ||
            result == 'C' ||
            result == 'D')
         printf("You have passed\n" );
    else if (result == 'F')
         printf("Sorry, you have failed\n" );
    else
         printf("Invalid result\n" );
}
