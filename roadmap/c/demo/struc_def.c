#include <stdio.h>
#include <string.h>

struct Project {
   char  name[30];
   char  author[30];
} p;

int main( ) {
   strcpy( p.name,   "C Language");
   strcpy( p.author, "Dennis Ritchie");
   printf( "project: %s\n", p.name);
   printf( "author: %s\n", p.author);
}