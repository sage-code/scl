// 01_types_and_operators.cpp
// Build & run:  g++ -std=c++17 -Wall -Wextra -O2 01_types_and_operators.cpp -o demo01 && ./demo01
//
// Goal: see the fundamental C++ types in action, learn how many bytes each one
// uses on THIS machine, and practise the operators that combine values. Read the
// comments, then compare each printed value with the source line that produced it.

#include <iostream>  // std::cout
#include <iomanip>   // std::setprecision
#include <limits>    // std::numeric_limits

int main() {
    // --- Integer family: each type guarantees a MINIMUM range, not a fixed size.
    short     s = 32000;            // at least 16 bits
    int       i = 42;               // the machine's "natural" integer (usually 32 bits)
    long long l = 9'000'000'000LL;  // needs 64 bits: use long long (on Windows `long` is 32-bit)
    std::cout << "short=" << s << " int=" << i << " long long=" << l << "\n";

    // sizeof reports how many bytes a type occupies on this platform. Note `long` is
    // 8 bytes on Linux but only 4 on Windows — never assume a size, always check.
    std::cout << "sizeof(short)=" << sizeof(short)
              << " sizeof(int)=" << sizeof(int)
              << " sizeof(long)=" << sizeof(long)
              << " sizeof(long long)=" << sizeof(long long) << "\n";

    // --- Floating point: float (single precision) vs double (double precision).
    float  f = 3.14159f;              // the 'f' suffix proves you meant float
    double d = 3.141592653589793;     // the default type for real numbers
    std::cout << std::setprecision(10) << "float=" << f << " double=" << d << "\n";
    // Notice float loses digits: it stores ~7 significant digits, double ~15.

    // --- char and bool are small integer types that print differently.
    char letter = 'A';
    bool flag = true;
    std::cout << "letter=" << letter << " (as int " << static_cast<int>(letter) << ")"
              << " flag=" << std::boolalpha << flag << "\n";
    // std::boolalpha makes bool print as "true"/"false" instead of 1/0.

    // --- Arithmetic, including the two classic integer traps.
    int a = 7, b = 2;
    std::cout << a << "/" << b << " = " << (a / b) << "   (integer division DROPS the fraction)\n";
    std::cout << a << "%" << b << " = " << (a % b) << "   (remainder)\n";
    double real = static_cast<double>(a) / b;   // cast one side to get real division
    std::cout << "with a cast: " << real << "\n";

    // --- Comparison and logical operators yield a bool.
    std::cout << "(a>b)=" << (a > b) << " (a==b)=" << (a == b)
              << " (a>b && b>0)=" << (a > b && b > 0) << "\n";

    // --- Compound assignment and increment.
    int counter = 0;
    counter += 5;   // counter = counter + 5
    counter++;      // add one
    std::cout << "counter=" << counter << "\n";

    // --- Overflow reality check: signed overflow is UB, so know your limits.
    std::cout << "max int = " << std::numeric_limits<int>::max() << "\n";
    std::cout << "min int = " << std::numeric_limits<int>::min() << "\n";
    return 0;   // 0 tells the shell the program succeeded
}
