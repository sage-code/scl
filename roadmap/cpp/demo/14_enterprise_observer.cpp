// 14_enterprise_observer.cpp
// Build & run:  g++ -std=c++17 -Wall -Wextra -O2 14_enterprise_observer.cpp -o demo14 && ./demo14
//
// Goal: a classic enterprise pattern — the Observer (publish/subscribe). A subject
// keeps a list of subscribers and notifies them when its state changes. Using
// std::function as the callback type means subscribers can be lambdas, free
// functions, or member functions, all stored uniformly.

#include <iostream>
#include <string>
#include <vector>
#include <functional>   // std::function
#include <algorithm>    // std::remove_if

// The callback signature every subscriber must match.
using Listener = std::function<void(const std::string &)>;

// --- Subject: tracks subscribers and broadcasts events to them. --------------
class EventBus {
public:
    // Subscribe returns an id so the caller can unsubscribe later —
    // important in long-running services to avoid callbacks outliving their data.
    int subscribe(Listener listener) {
        const int id = nextId_++;
        subscribers_.push_back({id, std::move(listener)});
        return id;
    }

    void unsubscribe(int id) {
        subscribers_.erase(
            std::remove_if(subscribers_.begin(), subscribers_.end(),
                           [id](const auto &s) { return s.id == id; }),
            subscribers_.end());
    }

    void publish(const std::string &event) const {
        for (const auto &s : subscribers_) {
            s.handler(event);          // call each subscriber with the event
        }
    }

private:
    struct Subscriber { int id; Listener handler; };
    std::vector<Subscriber> subscribers_;
    int nextId_ = 1;                   // ids start at 1; 0 can mean "none"
};

// A plain function subscriber.
void audit(const std::string &event) {
    std::cout << "  audit: " << event << "\n";
}

int main() {
    EventBus bus;

    // Subscribe a free function, a capturing lambda, and another lambda.
    int auditId = bus.subscribe(audit);
    int count = 0;
    bus.subscribe([&count](const std::string &) { ++count; });      // counts events
    int logId = bus.subscribe([](const std::string &e) {
        std::cout << "  logger: received '" << e << "'\n";
    });

    std::cout << "first publish:\n";
    bus.publish("order.created");

    std::cout << "unsubscribe the logger, publish again:\n";
    bus.unsubscribe(logId);
    bus.publish("order.shipped");

    std::cout << "events counted by the counting subscriber = " << count << "\n";
    (void)auditId;   // kept to show a subscription handle can be held for later use
    return 0;
}
