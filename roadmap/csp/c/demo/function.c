#include <stdio.h>
// no result
void add1(int a, int b) {
    printf("ad1 = %d\n",a+b);
};
// has int result
int add2(int a, int b) {
    return a+b;
};

void main() {
    int x;
    /* call function add1 */
    add1(1,2); //print 1+1 = 2
    /* call function add2 */
    add2(1,2); //result is ignored
    /* call function add2
       in expression */
    int r = add2(1,2) + 1;
    printf("ad2 = %d\n",r);
}
