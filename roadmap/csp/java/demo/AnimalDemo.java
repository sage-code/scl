public class AnimalDemo {

  public static void main(String[] args) {
    Dog bili = new Dog("Bili");
    Cat fifi = new Cat("Fifi");

    speak(bili);
    speak(fifi);
  }

  private static void speak(Animal it) {
    System.out.println(it.speak());
  }

}

class Cat extends Animal {
  public Cat(String name) {
      super("feline");
      this.name = name;
  }
  @Override
  String speak() {
    return "miaou";
  }
}

class Dog extends Animal {
  public Dog(String name) {
      super("canine");
      this.name = name;
  }
  @Override
  String speak() {
    return "ham";
  }
}
