// 07_containers.cpp
// Build & run:  g++ -std=c++17 -Wall -Wextra -O2 07_containers.cpp -o demo07 && ./demo07
//
// Goal: meet the STL containers you will use every day and learn which one to
// pick. The rule of thumb: `vector` by default, `map`/`unordered_map` for lookups
// by key, `set` for unique membership. All of them manage their own memory.

#include <iostream>
#include <vector>
#include <string>         // std::string keys
#include <map>            // ordered map (balanced tree)
#include <unordered_map>  // hash map (average O(1) lookup)
#include <set>            // unique, sorted elements

int main() {
    // --- std::vector: a resizable array; iterate by index or by range-for -----
    std::vector<int> scores = {88, 92, 75};
    scores.push_back(100);              // grow at the end (amortised O(1))
    std::cout << "size=" << scores.size() << " front=" << scores.front()
              << " back=" << scores.back() << "\n";
    scores[0] = 90;                     // random access: O(1)
    for (int s : scores) std::cout << s << " ";
    std::cout << "\n";

    // --- std::map: keys kept in sorted order; great when order matters --------
    std::map<std::string, int> ages;
    ages["Ada"] = 36;
    ages["Grace"] = 45;
    ages["Bjarne"] = 70;
    for (const auto &[name, age] : ages) {   // structured bindings (C++17)
        std::cout << name << " is " << age << "\n";   // printed alphabetically
    }
    // count() tells you whether a key exists WITHOUT inserting one.
    if (ages.count("Ada")) std::cout << "Ada found: " << ages.at("Ada") << "\n";

    // --- std::unordered_map: prefer it for pure key lookups, O(1) average -----
    std::unordered_map<std::string, int> stock = {{"apple", 10}, {"pear", 4}};
    stock["apple"] += 5;                 // care: operator[] creates a missing key
    std::cout << "apples in stock=" << stock.at("apple") << "\n";
    // Use at() or find() when a missing key should NOT silently create an entry.

    // --- std::set: no duplicates, always sorted -------------------------------
    std::set<int> unique;
    unique.insert(3);
    unique.insert(1);
    unique.insert(3);                    // ignored: already present
    std::cout << "set: ";
    for (int v : unique) std::cout << v << " ";   // 1 3
    std::cout << " (duplicate 3 dropped)\n";
    return 0;
}
