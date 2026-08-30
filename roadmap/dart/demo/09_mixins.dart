mixin Walker { void walk() => print('Walking'); }
class Person with Walker {}

void main() {
  var p = Person();
  p.walk();
}