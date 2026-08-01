interface HelloWorld {
        public void greet();
        public void greetSomeone(String someone);
}

class Main {
  public static void main(String[] args) {
 
    HelloWorld frenchGreeting = new HelloWorld() {
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