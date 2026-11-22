// 08_algorithms_lambdas.cpp
// Build & run:  g++ -std=c++17 -Wall -Wextra -O2 08_algorithms_lambdas.cpp -o demo08 && ./demo08
//
// Goal: stop writing manual loops for common tasks. The <algorithm> library plus
// lambdas express "sort", "find", "count if", "transform" in one readable line,
// and the intent is clearer than a hand-written for loop.

#include <iostream>
#include <vector>
#include <algorithm>   // sort, find_if, count_if, transform, min_element
#include <numeric>     // accumulate
#include <string>

int main() {
    std::vector<int> data = {5, 2, 9, 1, 7, 3, 8};

    // --- sort with a lambda comparator: descending order ----------------------
    std::sort(data.begin(), data.end(), [](int a, int b) {
        return a > b;                 // return true when a must come before b
    });
    std::cout << "sorted desc: ";
    for (int v : data) std::cout << v << " ";
    std::cout << "\n";

    // --- find_if: locate the first element that satisfies a predicate ---------
    auto it = std::find_if(data.begin(), data.end(), [](int v) { return v % 2 == 0; });
    if (it != data.end()) std::cout << "first even = " << *it << "\n";

    // --- count_if: how many elements satisfy a condition ----------------------
    // The result type is ptrdiff_t (a signed size); `auto` keeps it portable.
    auto big = std::count_if(data.begin(), data.end(), [](int v) { return v > 5; });
    std::cout << "values > 5: " << big << "\n";

    // --- accumulate: fold a range into a single value -------------------------
    auto sum = std::accumulate(data.begin(), data.end(), 0);   // 0 is the start value
    std::cout << "sum = " << sum << "\n";

    // --- transform: apply a function to every element (out-of-place) ----------
    std::vector<int> doubled(data.size());
    std::transform(data.begin(), data.end(), doubled.begin(),
                   [](int v) { return v * 2; });
    std::cout << "doubled: ";
    for (int v : doubled) std::cout << v << " ";
    std::cout << "\n";

    // --- Capture: a lambda can use surrounding variables ----------------------
    int threshold = 6;
    auto above = std::count_if(data.begin(), data.end(),
                               [threshold](int v) { return v > threshold; });
    std::cout << "above threshold(" << threshold << ") = " << above << "\n";
    // Captures: [x] by value (a snapshot), [&x] by reference (live), [=]/[&] all.
    // Prefer capturing the few names you need; a big capture list hides data flow.

    // --- min/max through algorithms, no manual loop ---------------------------
    auto smallest = std::min_element(data.begin(), data.end());
    auto largest  = std::max_element(data.begin(), data.end());
    std::cout << "range: " << *smallest << " .. " << *largest << "\n";
    return 0;
}
