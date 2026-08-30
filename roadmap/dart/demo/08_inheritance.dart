class Animal { void eat() => print('Eating'); }
class Dog extends Animal { void bark() => print('Barking'); }

void main() {
  var d = Dog();
  d.eat();
  d.bark();
}