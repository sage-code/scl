#include <stdio.h>
int main()
{
    int x = 0;
    //positive test
    if (x == 0) {
        printf("this is expected");
    } else {
        printf("this is unexpected");
    }
    return 0;
}