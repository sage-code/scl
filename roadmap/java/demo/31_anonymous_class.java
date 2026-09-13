/* Java lab demo 31 — an anonymous implementation of an interface.
 *
 * Run:  javac 31_anonymous_class.java  &&  java AnonymousDemo
 */
interface Greeter {
        public void greet();
        public void greetSomeone(String someone);
}

class AnonymousDemo {
  public static void main(String[] args) {
 
    Greeter frenchGreeting = new Greeter() {
            String name = "tout le monde";
            public void greet() {
                greetSomeone("tout le monde");
            }
            public void greetSomeone(String someone) {
                name = someone;
                System.out.println("Salut " + name);
            }
    };   
    frenchGreeting.greet();
    frenchGreeting.greetSomeone("You");
  }
}