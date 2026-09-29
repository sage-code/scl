// 09 - Classes: constructors, methods, and mutable fields
// Run: scala-cli run 09_classes.scala

class Point(var x: Int, var y: Int) {
  def move(dx: Int, dy: Int): Unit = {
    x = x + dx
    y = y + dy
  }

  override def toString: String = s"Point($x, $y)"
}

@main def classes(): Unit =
  // a plain class needs `new` — unlike a case class, it has no
  // compiler-generated apply() factory method
  val point1 = new Point(2, 3)
  println(point1.x) // 2

  point1.move(1, 1)
  println(point1) // Point(3, 4)

  // an auxiliary constructor overload
  class Rectangle(val width: Int, val height: Int) {
    def this(side: Int) = this(side, side) // a square is a special rectangle
    def area: Int = width * height
  }

  val square = new Rectangle(5)
  println(s"square area = ${square.area}") // 25
