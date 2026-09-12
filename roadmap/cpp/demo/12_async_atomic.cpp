// 12_async_atomic.cpp
// Build & run:  g++ -std=c++17 -Wall -Wextra -O2 -pthread 12_async_atomic.cpp -o demo12 && ./demo12
//
// Goal: two higher-level tools than raw threads. `std::async` runs a function and
// hands back a `future` you can collect when convenient (task-based concurrency).
// `std::atomic` lets several threads share a counter with no explicit lock.

#include <iostream>
#include <future>       // std::async, std::future
#include <atomic>       // std::atomic
#include <thread>
#include <vector>
#include <cmath>        // std::sqrt

// A pure, expensive-looking function — perfect to run off the main thread.
double heavyCompute(int n) {
    double sum = 0.0;
    for (int i = 1; i <= n; ++i) sum += std::sqrt(static_cast<double>(i));
    return sum;
}

std::atomic<long> gAtomicCount{0};   // lock-free counter shared by all threads

void bump(int rounds) {
    for (int i = 0; i < rounds; ++i) {
        gAtomicCount.fetch_add(1, std::memory_order_relaxed);  // indivisible add
    }
}

int main() {
    // --- std::async: start work now, collect the result later -----------------
    std::future<double> job = std::async(std::launch::async, heavyCompute, 1'000'000);
    std::cout << "main thread does other work while the task runs...\n";
    double result = job.get();          // blocks here until the task is done
    std::cout << "heavyCompute result = " << result << "\n";

    // --- Several tasks in parallel, gathered into a vector of futures ---------
    std::vector<std::future<double>> futures;
    for (int n : {100'000, 200'000, 300'000}) {
        futures.push_back(std::async(std::launch::async, heavyCompute, n));
    }
    double grand = 0.0;
    for (auto &f : futures) grand += f.get();   // collect in order
    std::cout << "grand total = " << grand << "\n";

    // --- std::atomic: correct sharing without a mutex -------------------------
    const int rounds = 100'000, threads = 4;
    std::vector<std::thread> pool;
    for (int i = 0; i < threads; ++i) pool.emplace_back(bump, rounds);
    for (auto &t : pool) t.join();
    std::cout << "atomic count = " << gAtomicCount
              << " (expected " << rounds * threads << ")\n";
    // Prefer atomic for simple counters/flags; keep a mutex when several related
    // values must change together (an atomic can only protect one variable).
    return 0;
}
