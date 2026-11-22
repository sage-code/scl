// 16 - Algebraic data types: sealed traits + case classes, matched exhaustively
// Run: scala-cli run 16_pattern_matching_adt.scala

// `sealed` restricts every subtype to this file, so the compiler can check
// that a match covers every case and warn you if one is missing
sealed trait Shape
case class Circle(radius: Double) extends Shape
case class Rectangle(width: Double, height: Double) extends Shape
case class Triangle(base: Double, height: Double) extends Shape

def area(shape: Shape): Double = shape match {
  case Circle(r)         => math.Pi * r * r
  case Rectangle(w, h)   => w * h
  case Triangle(b, h)    => 0.5 * b * h
  // no `case _` needed — the compiler knows these three are the only
  // possible subtypes of a sealed trait, and warns if one is left out
}

@main def patternMatchingAdt(): Unit =
  val shapes: List[Shape] = List(
    Circle(2.0),
    Rectangle(3.0, 4.0),
    Triangle(6.0, 2.0)
  )

  for (shape <- shapes) {
    val a = area(shape)
    println(f"$shape%-20s area = $a%.2f")
  }

  val totalArea = shapes.map(area).sum
  println(f"total area = $totalArea%.2f")
