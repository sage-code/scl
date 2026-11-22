// 03_functions.cpp
// Build & run:  g++ -std=c++17 -Wall -Wextra -O2 03_functions.cpp -o demo03 && ./demo03
//
// Goal: understand how functions are declared, how arguments are passed (by
// value vs by reference), and how overloading and default arguments let one name
// serve related jobs. Pay attention to which parameters are `const`.

#include <iostream>
#include <string>
#include <vector>

// --- Pass by value: the function gets a COPY; the caller is never changed. ----
int square(int x) {
    return x * x;
}

// --- Pass by reference: the function shares the caller's object. --------------
// `int &` allows modification; `const&` only reads (and avoids a copy).
void addToScore(int &score, int delta) {
    score += delta;                 // writes through the reference
}

// --- Pass a big object by const reference to avoid copying it. ----------------
double average(const std::vector<double> &values) {
    if (values.empty()) return 0.0; // guard against divide-by-zero
    double sum = 0.0;
    for (double v : values) sum += v;
    return sum / static_cast<double>(values.size());
}

// --- Overloading: same name, different parameter lists. ----------------------
std::string describe(int n)    { return "integer " + std::to_string(n); }
std::string describe(double d) { return "double " + std::to_string(d); }
std::string describe(const std::string &s) { return "text \"" + s + "\""; }
// The compiler picks the overload from the ARGUMENT TYPES at the call site.

// --- Default arguments: only the right-most parameters may have defaults. -----
void greet(const std::string &name, const std::string &greeting = "Hello") {
    std::cout << greeting << ", " << name << "!\n";
}

// --- Returning multiple values the idiomatic modern way: a struct. -----------
struct Stats { int min; int max; };

Stats minmax(const std::vector<int> &data) {
    Stats result{data.front(), data.front()};
    for (int v : data) {
        if (v < result.min) result.min = v;   // remember the smallest
        if (v > result.max) result.max = v;   // remember the largest
    }
    return result;
}

int main() {
    std::cout << "square(9) = " << square(9) << "\n";

    int score = 10;
    addToScore(score, 5);                 // modifies the caller's variable
    std::cout << "score after bonus = " << score << "\n";

    std::vector<double> marks = {7.5, 9.0, 6.5, 8.0};
    std::cout << "average = " << average(marks) << "\n";

    // Overload resolution in action — the argument type selects the function.
    std::cout << describe(3) << " / " << describe(2.5) << " / "
              << describe(std::string("C++")) << "\n";

    greet("Ada");                         // uses the default greeting
    greet("Grace", "Hi");                 // overrides the default

    Stats s = minmax({4, -1, 9, 7});
    std::cout << "min=" << s.min << " max=" << s.max << "\n";
    return 0;
}
