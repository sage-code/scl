// 12 - Case classes: value semantics, equality, and pattern matching
// Run: scala-cli run 12_case_classes.scala

// `case` gives you, for free: a public constructor param for every field,
// structural equals/hashCode, a readable toString, and a copy() method
case class Point(x: Int, y: Int)

@main def caseClasses(): Unit =
  // no `new` needed — case classes get a compiler-generated apply()
  val p1 = Point(1, 2)
  val p2 = Point(1, 2)
  val p3 = Point(3, 4)

  println(p1)              // Point(1,2) — readable toString for free
  println(p1 == p2)         // true — compares values, not references
  println(p1 == p3)         // false

  // copy() creates a modified clone without touching the original
  val moved = p1.copy(x = p1.x + 10)
  println(moved) // Point(11,2)

  // case classes destructure naturally in a match expression
  def describe(p: Point): String = p match {
    case Point(0, 0) => "the origin"
    case Point(x, 0) => s"on the x-axis at $x"
    case Point(0, y) => s"on the y-axis at $y"
    case Point(x, y) => s"at ($x, $y)"
  }

  println(describe(Point(0, 0)))
  println(describe(Point(5, 0)))
  println(describe(p3))
