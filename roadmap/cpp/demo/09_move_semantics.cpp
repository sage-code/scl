// 09_move_semantics.cpp
// Build & run:  g++ -std=c++17 -Wall -Wextra -O2 09_move_semantics.cpp -o demo09 && ./demo09
//
// Goal: understand why modern C++ avoids copying big objects. A "move" steals the
// internal buffer of a dying object instead of duplicating it. This demo builds a
// small buffer class by hand so you can SEE each constructor and destructor run.

#include <iostream>
#include <string>
#include <algorithm>     // std::copy
#include <utility>       // std::move
#include <vector>

class Buffer {
public:
    explicit Buffer(std::size_t n) : size_(n), data_(new int[n]) {   // allocate
        std::cout << "  [ctor] malloc " << size_ << " ints\n";
    }

    Buffer(const Buffer &other)                                 // COPY: duplicate
        : size_(other.size_), data_(new int[other.size_]) {
        std::copy(other.data_, other.data_ + size_, data_);
        std::cout << "  [copy ctor] duplicated " << size_ << " ints\n";
    }

    Buffer(Buffer &&other) noexcept                             // MOVE: steal
        : size_(other.size_), data_(other.data_) {
        other.data_ = nullptr;   // leave the source empty so its destructor is safe
        other.size_ = 0;
        std::cout << "  [move ctor] stole " << size_ << " ints\n";
    }

    Buffer &operator=(Buffer &&other) noexcept {                // MOVE assign
        if (this != &other) {
            delete[] data_;              // release our own buffer first
            data_ = other.data_;         // steal theirs
            size_ = other.size_;
            other.data_ = nullptr;
            other.size_ = 0;
        }
        return *this;
    }

    ~Buffer() { delete[] data_; std::cout << "  [dtor] freed " << size_ << " ints\n"; }

    std::size_t size() const { return size_; }

private:
    std::size_t size_;
    int *data_;
};

int main() {
    std::cout << "constructing a\n";
    Buffer a(3);

    std::cout << "copying a into b (duplicates the buffer)\n";
    Buffer b = a;                      // copy ctor runs

    std::cout << "moving a copy into c (steals, no duplication)\n";
    Buffer c = std::move(Buffer(5));   // temporary is moved, not copied

    std::cout << "putting a move-only object into a vector\n";
    std::vector<Buffer> vec;
    vec.push_back(std::move(a));       // vector stores by move; `a` is now empty

    std::cout << "sizes: b=" << b.size() << " c=" << c.size()
              << " vec[0]=" << vec[0].size() << " a(moved)=" << a.size() << "\n";
    std::cout << "end of main — destructors run in reverse order\n";
    return 0;
}
