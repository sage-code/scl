// 15 - Generics: type parameters on functions and classes
// Run: scala-cli run 15_generics.scala

// a generic function: works for any type A, decided at the call site
def firstOf[A](items: List[A]): Option[A] =
  if (items.isEmpty) None else Some(items.head)

// a generic class: Box can hold any single type
class Box[A](val value: A) {
  def map[B](f: A => B): Box[B] = new Box(f(value))
  override def toString: String = s"Box($value)"
}

// a bounded type parameter: A must be a subtype of Comparable-like Ordered
def maxOf[A](a: A, b: A)(implicit ord: Ordering[A]): A =
  if (ord.gt(a, b)) a else b

@main def generics(): Unit =
  println(firstOf(List(1, 2, 3)))         // Some(1)
  println(firstOf(List("a", "b")))        // Some(a)
  println(firstOf(List.empty[Int]))       // None

  val intBox = new Box(42)
  val stringBox = intBox.map(n => s"value is $n")
  println(intBox)     // Box(42)
  println(stringBox)  // Box(value is 42)

  println(maxOf(3, 7))          // 7
  println(maxOf("apple", "pear")) // pear
