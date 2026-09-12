// 13_enterprise_logging.cpp
// Build & run:  g++ -std=c++17 -Wall -Wextra -O2 13_enterprise_logging.cpp -o demo13 && ./demo13
//
// Goal: a realistic building block you find in production code — a small logging
// facility with severity levels and an RAII scope guard that records how long a
// block of work took. This is how enterprise C++ stays observable AND leak-free
// without any manual cleanup.

#include <iostream>
#include <string>
#include <chrono>       // steady_clock for measuring durations
#include <utility>

// --- Severity levels, ordered so comparisons like `>= Level::Warning` work. ---
enum class Level { Debug = 0, Info, Warning, Error };

std::string toString(Level l) {
    switch (l) {
        case Level::Debug:   return "DEBUG";
        case Level::Info:    return "INFO ";
        case Level::Warning: return "WARN ";
        case Level::Error:   return "ERROR";
    }
    return "?????";
}

// --- A minimal logger with a configurable minimum level. ---------------------
class Logger {
public:
    explicit Logger(Level minLevel) : minLevel_(minLevel) {}

    void log(Level level, const std::string &message) const {
        if (level < minLevel_) return;   // drop messages below the threshold
        std::cout << "[" << toString(level) << "] " << message << "\n";
    }

private:
    Level minLevel_;
};

// --- RAII scope guard: logs entry, then exit + elapsed time. -----------------
class ScopedTiming {
public:
    ScopedTiming(const Logger &logger, std::string name)
        : logger_(logger), name_(std::move(name)),
          start_(std::chrono::steady_clock::now()) {
        logger_.log(Level::Debug, "begin " + name_);
    }

    ~ScopedTiming() {
        using namespace std::chrono;
        auto ms = duration_cast<milliseconds>(steady_clock::now() - start_).count();
        logger_.log(Level::Debug, "end   " + name_ + " (" + std::to_string(ms) + " ms)");
    }

    ScopedTiming(const ScopedTiming &) = delete;             // a guard must not be copied
    ScopedTiming &operator=(const ScopedTiming &) = delete;

private:
    const Logger &logger_;
    std::string name_;
    std::chrono::steady_clock::time_point start_;
};

// --- A service that emits log lines at different severities ------------------
void processOrder(const Logger &log, int orderId) {
    ScopedTiming timing(log, "processOrder#" + std::to_string(orderId));
    log.log(Level::Info, "processing order " + std::to_string(orderId));
    if (orderId < 0) {
        log.log(Level::Error, "invalid order id " + std::to_string(orderId));
        return;                       // the guard still logs "end" on this early return
    }
    log.log(Level::Debug, "validation passed");
    log.log(Level::Info, "order committed");
}

int main() {
    Logger log(Level::Info);          // Debug lines are filtered out here
    processOrder(log, 1024);
    processOrder(log, -7);            // demonstrates the early-return path + timing

    Logger verbose(Level::Debug);     // raise verbosity by constructing another logger
    processOrder(verbose, 2048);      // now Debug timing lines appear too
    return 0;
}
