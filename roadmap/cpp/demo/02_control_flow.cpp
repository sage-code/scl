// 02_control_flow.cpp
// Build & run:  g++ -std=c++17 -Wall -Wextra -O2 02_control_flow.cpp -o demo02 && ./demo02
//
// Goal: practise every decision and loop form C++ offers and, crucially, learn
// WHEN to reach for each one. A range-based for is preferred whenever you simply
// need every element; an index loop is for when the position matters.

#include <iostream>
#include <vector>
#include <string>

// A tiny helper so the output is readable: every section prints a title line.
void section(const std::string &title) {
    std::cout << "\n== " << title << " ==\n";
}

int main() {
    // --- if / else if / else -------------------------------------------------
    section("if / else if / else");
    int score = 82;
    if (score >= 90) {
        std::cout << "grade A\n";
    } else if (score >= 80) {
        std::cout << "grade B\n";   // 82 lands here
    } else {
        std::cout << "grade C or lower\n";
    }

    // --- switch: best for a fixed set of discrete choices --------------------
    section("switch");
    int day = 3;   // 1 = Monday ... 7 = Sunday
    switch (day) {
        case 6:
        case 7:                       // deliberate fall-through: both weekend days
            std::cout << "Weekend\n";
            break;                    // break stops the fall-through
        case 1:
            std::cout << "Start of the work week\n";
            break;
        default:
            std::cout << "A working day\n";
            break;
    }
    // Rule of thumb: use switch for enums and small integer sets; it documents
    // intent and lets the compiler warn about an unhandled enum value.

    // --- classic for loop: use when the INDEX is part of the logic -----------
    section("classic for");
    for (int i = 1; i <= 5; ++i) {
        std::cout << i * i << " ";    // prints squares 1 4 9 16 25
    }
    std::cout << "\n";

    // --- range-based for: the default when you just want the elements --------
    section("range-based for");
    std::vector<std::string> names = {"Ada", "Bjarne", "Grace"};
    for (const std::string &name : names) {   // const ref avoids a copy
        std::cout << "Hello, " << name << "\n";
    }
    // Use `auto&`/`const auto&` when the element type is verbose or a template.

    // --- while: loop while a condition holds, count unknown up front ---------
    section("while");
    int n = 27, steps = 0;
    while (n != 1) {                 // the Collatz sequence
        n = (n % 2 == 0) ? n / 2 : 3 * n + 1;
        ++steps;
    }
    std::cout << "reached 1 after " << steps << " steps\n";

    // --- do-while: the body runs at least once -------------------------------
    section("do-while");
    int attempt = 0;
    do {
        ++attempt;
        std::cout << "attempt " << attempt << "\n";
    } while (attempt < 3);           // condition checked AFTER the body

    return 0;
}
