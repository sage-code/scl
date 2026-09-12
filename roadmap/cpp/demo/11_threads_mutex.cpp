// 11_threads_mutex.cpp
// Build & run:  g++ -std=c++17 -Wall -Wextra -O2 -pthread 11_threads_mutex.cpp -o demo11 && ./demo11
//
// Goal: run work on several threads and protect shared data from races. Without a
// lock two threads can interleave reads and writes and corrupt a counter — this is
// exactly the class of bug threads introduce. The mutex + lock_guard pair is the
// simplest correct fix.

#include <iostream>
#include <thread>       // std::thread, std::this_thread
#include <mutex>        // std::mutex, std::lock_guard
#include <vector>

std::mutex gMutex;              // one lock guarding gTotal below
long gTotal = 0;                // SHARED state — every access must be synchronised

// Unsafe increment: reads, adds, writes. Run on many threads it loses updates.
void addUnsafe(int rounds) {
    for (int i = 0; i < rounds; ++i) {
        ++gTotal;               // NOT atomic: data race!
    }
}

// Safe increment: the lock makes read-modify-write one indivisible step.
void addSafe(int rounds) {
    for (int i = 0; i < rounds; ++i) {
        std::lock_guard<std::mutex> lock(gMutex);  // locks here...
        ++gTotal;
    }   // ...and unlocks automatically at the brace (RAII — cannot forget)
}

int main() {
    const int rounds = 100'000;
    const int threads = 4;

    // --- Race condition: expect a WRONG total --------------------------------
    gTotal = 0;
    {
        std::vector<std::thread> pool;
        for (int i = 0; i < threads; ++i) pool.emplace_back(addUnsafe, rounds);
        for (auto &t : pool) t.join();     // join = wait for every thread to finish
    }
    long expected = static_cast<long>(rounds) * threads;
    std::cout << "unsafe total = " << gTotal << " (expected " << expected
              << ") — usually too small\n";

    // --- With a mutex: the total is exactly right ----------------------------
    gTotal = 0;
    {
        std::vector<std::thread> pool;
        for (int i = 0; i < threads; ++i) pool.emplace_back(addSafe, rounds);
        for (auto &t : pool) t.join();
    }
    std::cout << "safe total   = " << gTotal << " (expected " << expected << ")\n";
    return 0;
}
