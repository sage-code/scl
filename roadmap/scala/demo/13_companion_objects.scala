// 13 - Companion objects: shared state, factory methods, and private access
// Run: scala-cli run 13_companion_objects.scala

// a companion class and companion object must live in the same file and
// share the same name — they can see each other's private members
class Demo private (val id: Int) {
  private val secret = id * 10
}

object Demo {
  private var nextId = 1

  // a factory method hides the constructor and controls how instances are made
  def create(): Demo = {
    val instance = new Demo(nextId)
    nextId += 1
    instance
  }

  // the companion object can reach into the class's private members
  def revealSecret(d: Demo): Int = d.secret
}

@main def companionObjects(): Unit =
  val d1 = Demo.create()
  val d2 = Demo.create()

  println(s"d1.id = ${d1.id}, d2.id = ${d2.id}") // 1, 2
  println(s"secret of d1 = ${Demo.revealSecret(d1)}") // 10

  // Demo(5) would fail: the primary constructor is private, only the
  // companion object's create() can build one
