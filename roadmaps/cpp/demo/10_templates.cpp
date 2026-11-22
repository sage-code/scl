// 10_templates.cpp
// Build & run:  g++ -std=c++17 -Wall -Wextra -O2 10_templates.cpp -o demo10 && ./demo10
//
// Goal: write code once that works for many types. Templates are compile-time
// blueprints: the same source generates a separate, fully typed function or class
// for every set of arguments you use. That is why we say generics cost nothing at
// run time.

#include <iostream>
#include <string>
#include <vector>
#include <type_traits>   // is_arithmetic_v, static_assert

// --- Function template: `maxOf` for any type that supports operator> ----------
template <typename T>
T maxOf(T a, T b) {
    return (a > b) ? a : b;
}

// --- Class template: a tiny typed stack with a fixed capacity ----------------
template <typename T, std::size_t Capacity>
class FixedStack {
public:
    bool push(const T &value) {
        if (count_ == Capacity) return false;   // full: refuse politely
        items_[count_++] = value;
        return true;
    }
    bool pop(T &out) {
        if (count_ == 0) return false;          // empty: nothing to give
        out = items_[--count_];
        return true;
    }
    std::size_t size() const { return count_; }

private:
    T items_[Capacity]{};   // value-initialised storage, no dynamic allocation
    std::size_t count_ = 0;
};

// --- A constrained template: only allow arithmetic types ---------------------
// static_assert turns a wrong usage into a clear COMPILE-TIME error message.
template <typename T>
T average(const std::vector<T> &values) {
    static_assert(std::is_arithmetic_v<T>,
                  "average() requires an arithmetic type (int, double, ...)");
    T sum{};                          // {} means "value-initialise" (0 for numbers)
    for (const T &v : values) sum += v;
    return values.empty() ? T{} : sum / static_cast<T>(values.size());
}

int main() {
    // The compiler creates maxOf<int> and maxOf<std::string> from one template.
    std::cout << maxOf(3, 9) << "\n";
    std::cout << maxOf(std::string("apple"), std::string("pear")) << "\n";

    // FixedStack<std::string, 3> is a distinct, fully typed class.
    FixedStack<std::string, 3> names;
    names.push("Ada");
    names.push("Grace");
    names.push("Bjarne");
    std::cout << "push into a full stack? " << names.push("extra") << " (false = rejected)\n";

    std::string popped;
    while (names.pop(popped)) std::cout << "popped " << popped << "\n";   // LIFO order

    std::cout << "average = " << average(std::vector<double>{2.0, 4.0, 6.0}) << "\n";
    // Try `average(std::vector<std::string>{...})` and read the compile error —
    // the static_assert message is far clearer than "no match for operator/".
    return 0;
}
