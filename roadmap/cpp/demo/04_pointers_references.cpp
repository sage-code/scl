// 04_pointers_references.cpp
// Build & run:  g++ -std=c++17 -Wall -Wextra -O2 04_pointers_references.cpp -o demo04 && ./demo04
//
// Goal: be able to tell references and pointers apart and choose the right tool.
// A reference is an alias that must be bound and can never be null; a pointer is
// a variable holding an address that can be re-seated and can be null.

#include <iostream>
#include <memory>    // std::unique_ptr
#include <string>

struct Point { double x; double y; };

// A reference parameter is the clean way to "hand over" a mutable object.
void moveBy(Point &p, double dx, double dy) {
    p.x += dx;   // dot-notation: the reference behaves exactly like the object
    p.y += dy;
}

int main() {
    // --- References: an alias for an existing object -------------------------
    int value = 42;
    int &ref = value;      // ref IS value; there is no separate object
    ref = 100;             // writing through the alias changes the original
    std::cout << "value=" << value << "\n";
    // A reference must be initialised and can never be re-bound or null.

    Point a{0.0, 0.0};
    moveBy(a, 3.0, 4.0);   // the function edits `a` directly, no copy
    std::cout << "point=(" << a.x << ", " << a.y << ")\n";

    // --- Pointers: a variable that stores an address -------------------------
    int number = 7;
    int *ptr = &number;    // & takes the address; ptr now points at number
    std::cout << "*ptr=" << *ptr << "\n";   // * dereferences: read the pointee
    *ptr = 21;             // write through the pointer
    std::cout << "number=" << number << "\n";

    // A pointer can be re-seated to another object...
    int other = 5;
    ptr = &other;
    std::cout << "now points to " << *ptr << "\n";

    // ...and can be null. ALWAYS test before dereferencing.
    ptr = nullptr;
    if (ptr) {                        // false when ptr is nullptr
        std::cout << "never reached\n";
    } else {
        std::cout << "ptr is null — safe to skip\n";
    }

    // --- References vs pointers: the practical rule --------------------------
    // Prefer references for parameters/aliases (cannot be null, no syntax noise).
    // Use pointers only when nullability or re-seating is genuinely required.

    // --- Owning memory: never use raw new/delete by hand — use smart pointers -
    auto heapPoint = std::make_unique<Point>(Point{1.0, 2.0});
    heapPoint->x = 9.0;               // -> is dereference + member access
    std::cout << "heap point x=" << heapPoint->x << "\n";
    // No delete: the unique_ptr releases the memory when it goes out of scope.
    return 0;
}
