/* Java lab demo 30 — inheritance, abstract classes and polymorphism.
 *
 * Animal declares a contract (speak) without implementing it, so it can never
 * be instantiated on its own. Dog and Cat are the concrete types. The caller
 * never tests which one it holds: introduce() takes the abstract type and the
 * JVM resolves the right speak() at run time — that is polymorphism.
 *
 * Run:  javac 30_animal_polymorphism.java  &&  java AnimalDemo
 */
import java.util.HashSet;
import java.util.Set;

abstract class Animal {
  String kind;
  String name;
  Set<String> tricks = new HashSet<>();

  Animal(String kind) {
    this.kind = kind;
  }

  void addTrick(String trick) {
    tricks.add(trick);
  }

  // No body: the subclass must say how this animal speaks.
  abstract String speak();
}

final class Dog extends Animal {
  Dog(String name) {
    super("canine");
    this.name = name;
  }

  @Override
  String speak() {
    return "ham";
  }
}

final class Cat extends Animal {
  Cat(String name) {
    super("feline");
    this.name = name;
  }

  @Override
  String speak() {
    return "miaou";
  }
}

class AnimalDemo {

  // The parameter is the abstract type, so this method keeps working for any
  // animal added later without a single type test inside it.
  private static void introduce(Animal it) {
    it.addTrick("sit");
    System.out.println(it.name + " (" + it.kind + ") says " + it.speak()
                       + ", tricks: " + it.tricks);
  }

  public static void main(String[] args) {
    introduce(new Dog("Bili"));
    introduce(new Cat("Fifi"));
  }
}
