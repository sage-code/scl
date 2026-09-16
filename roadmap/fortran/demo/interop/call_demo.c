/* call_demo.c — the C side of the bind(c) contract in 19_lib_c_api.f90.
 * Build with:  gcc -c call_demo.c && gfortran -shared -fPIC -o libc_api.so
 *              libc_api.f90 && gfortran -o demo call_demo.o libc_api.so
 * Run:         ./demo        (Linux/macOS: LD_LIBRARY_PATH=. ./demo)      */
#include <stdio.h>

void scale_array(int n, double *arr, double factor);  /* Fortran export */

int main(void) {
    double v[3] = {1.0, 2.0, 3.0};
    scale_array(3, v, 10.0);        /* the Fortran multiplies in place */
    printf("v = [%.1f, %.1f, %.1f]\n", v[0], v[1], v[2]);
    return 0;
}