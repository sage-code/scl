// 10 - Inheritance: extends, override, and super
// Run: scala-cli run 10_inheritance.scala

class Point(val x: Int, val y: Int) {
  def move(dx: Int, dy: Int): Point =
    new Point(x + dx, y + dy)

  override def toString: String = s"($x, $y)"
}

class ColorPoint(x: Int, y: Int, val color: String = "black")
    extends Point(x, y) {

  // override must produce the same or a compatible return type
  override def move(dx: Int, dy: Int): ColorPoint =
    new ColorPoint(x + dx, y + dy, color)

  def sameLocation(other: ColorPoint): Boolean =
    x == other.x && y == other.y

  override def toString: String = s"($x, $y, $color)"
}

@main def inheritance(): Unit =
  val cp  = new ColorPoint(1, 1, "red")
  val cp1 = cp.move(1, 1)
  val cp2 = cp.move(1, 1)

  println(cp1)                          // (2, 2, red)
  println(s"cp1 same location as cp2: ${cp1.sameLocation(cp2)}") // true
