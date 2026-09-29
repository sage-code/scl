// 11 - Traits: mixing in behavior with `extends` and `with`
// Run: scala-cli run 11_traits.scala

trait Greeter {
  def sayHello(): Unit = println("Hello, friend!") // default implementation
}

trait Chore {
  def todo(what: String): Unit // abstract — no body, implementers must supply one
}

// a class can extend one trait/class and mix in several more with `with`
class Assistant() extends Greeter with Chore {
  def todo(what: String): Unit =
    println(s"You must $what")
}

@main def traits(): Unit =
  val a = new Assistant()
  a.sayHello()          // uses the trait's default implementation
  a.todo("wash dishes")  // uses the class's own implementation

  // traits can also stack: the last mixed-in trait wins for shared methods
  trait Loud { def volume: String = "LOUD" }
  trait Quiet extends Loud { override def volume: String = "quiet" }
  class Speaker extends Quiet
  println(new Speaker().volume) // quiet
