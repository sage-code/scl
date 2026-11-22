// 06_polymorphism.cpp
// Build & run:  g++ -std=c++17 -Wall -Wextra -O2 06_polymorphism.cpp -o demo06 && ./demo06
//
// Goal: use an abstract base class, virtual functions and override to write code
// that works on ANY shape, then store the shapes in a container of smart
// pointers. This is the heart of object-oriented design in C++.

#include <iostream>
#include <memory>       // std::unique_ptr
#include <vector>
#include <string>

constexpr double kPi = 3.14159265358979323846;

// --- Abstract base class: the interface every shape must satisfy. -------------
class Shape {
public:
    virtual ~Shape() = default;              // virtual destructor: required for safe deletion
    virtual double area() const = 0;         // pure virtual: no body, makes Shape abstract
    virtual std::string name() const = 0;
};

class Circle : public Shape {
public:
    explicit Circle(double r) : r_(r) {}
    double area() const override { return kPi * r_ * r_; }   // override = typos become errors
    std::string name() const override { return "circle"; }
private:
    double r_;
};

class Rectangle : public Shape {
public:
    Rectangle(double w, double h) : w_(w), h_(h) {}
    double area() const override { return w_ * h_; }
    std::string name() const override { return "rectangle"; }
private:
    double w_, h_;
};

class Square : public Rectangle {          // reuse: a square is a rectangle with w == h
public:
    explicit Square(double side) : Rectangle(side, side) {}
    std::string name() const override { return "square"; }
};

int main() {
    // A container of base-class pointers. Each element may hold a DIFFERENT
    // derived type; the correct area() is chosen at run time (dynamic dispatch).
    std::vector<std::unique_ptr<Shape>> shapes;
    shapes.push_back(std::make_unique<Circle>(2.0));
    shapes.push_back(std::make_unique<Rectangle>(3.0, 4.0));
    shapes.push_back(std::make_unique<Square>(5.0));

    double total = 0.0;
    for (const auto &shape : shapes) {
        // We call the same expression on every object; the object decides how.
        std::cout << shape->name() << " area = " << shape->area() << "\n";
        total += shape->area();
    }
    std::cout << "total area = " << total << "\n";

    // Why unique_ptr and not Shape by value? Slicing: copying a Square into a
    // Shape would discard the derived part. Polymorphism needs pointers/refs.
    return 0;
    // The unique_ptrs destroy each object through the virtual destructor — no leaks.
}
