// 05_classes_raii.cpp
// Build & run:  g++ -std=c++17 -Wall -Wextra -O2 05_classes_raii.cpp -o demo05 && ./demo05
//
// Goal: build a small class the modern way and see RAII (Resource Acquisition Is
// Initialization) in action. A constructor acquires; the destructor releases —
// automatically, at the end of every scope, even when exceptions are thrown.

#include <iostream>
#include <string>
#include <utility>   // std::move

// A temperature value that enforces one simple invariant: it may never be below
// absolute zero. This shows encapsulation (private data + public interface).
class Temperature {
public:
    // Constructor: validate the input so an invalid object can never exist.
    explicit Temperature(double celsius) {
        if (celsius < -273.15) {
            std::cerr << "warning: clamping to absolute zero\n";
            celsius_ = -273.15;
        } else {
            celsius_ = celsius;
        }
    }
    double celsius() const { return celsius_; }              // getter (const = read-only)
    double fahrenheit() const { return celsius_ * 9.0 / 5.0 + 32.0; }

    void warmBy(double delta) {                              // mutator, re-checks invariant
        celsius_ = (celsius_ + delta < -273.15) ? -273.15 : celsius_ + delta;
    }

private:
    double celsius_;   // hidden state: callers cannot break the invariant directly
};

// RAII demonstrated with a GPS-style tracker: construct = "acquire logging",
// destructor = "release logging". The pair is guaranteed to balance.
class ScopeTimer {
public:
    explicit ScopeTimer(std::string label) : label_(std::move(label)) {
        std::cout << "[enter] " << label_ << "\n";
    }
    ~ScopeTimer() {                                          // runs automatically on scope exit
        std::cout << "[leave] " << label_ << "\n";
    }
    // Copying a guard would double-release, so we forbid it (rule of five helper).
    ScopeTimer(const ScopeTimer &) = delete;
    ScopeTimer &operator=(const ScopeTimer &) = delete;

private:
    std::string label_;
};

int main() {
    Temperature t(25.0);
    std::cout << t.celsius() << "C = " << t.fahrenheit() << "F\n";
    t.warmBy(10);
    std::cout << "after warming: " << t.celsius() << "C\n";

    {   // ---- a scope boundary: everything inside is set up and torn down -----
        ScopeTimer timer("critical section");   // constructor logs "enter"
        std::cout << "   doing work...\n";
        // ... imagine real work here; even if it throws, the destructor still runs
    }   // destructor logs "leave" here, no matter how we exit the block

    std::cout << "program continues after the scope closed\n";
    return 0;
}
