// 03 - Scalar types, casting, and Nothing/Null
// Run: scala-cli run 03_types.scala

@main def types(): Unit =
  val anInt: Int       = 42
  val aLong: Long      = 42L
  val aDouble: Double  = 3.14
  val aFloat: Float    = 3.14f
  val aByte: Byte      = 8
  val aChar: Char      = 'A'
  val aBoolean: Boolean = true

  println(s"$anInt $aLong $aDouble $aFloat $aByte $aChar $aBoolean")

  // widening conversions happen automatically
  val widened: Double = anInt // Int -> Double, safe, no cast needed

  // narrowing conversions need an explicit cast and can lose precision
  val narrowed: Int = aDouble.toInt // 3, the fraction is dropped

  println(s"widened = $widened, narrowed = $narrowed")

  // Nothing is the type of an expression that never returns — throwing an
  // exception has type Nothing, which is why it can stand in for any type
  def fail(msg: String): Int = throw new RuntimeException(msg)

  println("Nothing/Null are explained further in the Data Types lesson.")
