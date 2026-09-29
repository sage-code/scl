// 06 - if/else as an expression, and pattern matching with match
// Run: scala-cli run 06_control.scala

import scala.util.Random

@main def control(): Unit =
  // if/else is an expression — it produces a value
  val n = 7
  val parity = if (n % 2 == 0) "even" else "odd"
  println(s"$n is $parity")

  // match is a more powerful switch: it can match literals, types, and
  // patterns, and it must be exhaustive (or fall through to a wildcard `_`)
  for (_ <- 1 to 5) {
    val roll = Random.nextInt(6) + 1
    val label = roll match {
      case 1 => "one"
      case 2 => "two"
      case 3 => "three"
      case n if n % 2 == 0 => "even"   // a guard: only matches if the condition holds
      case _ => "other"
    }
    println(s"rolled $roll -> $label")
  }

  // matching on type
  def describe(x: Any): String = x match {
    case s: String  => s"a String of length ${s.length}"
    case i: Int      => s"an Int: $i"
    case _           => "something else"
  }

  println(describe("hello"))
  println(describe(42))
  println(describe(3.14))
