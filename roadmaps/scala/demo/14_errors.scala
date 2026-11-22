// 14 - Option, Try, and Either: error handling as values
// Run: scala-cli run 14_errors.scala

import scala.util.{Try, Success, Failure}

@main def errors(): Unit =
  // Option: a value that may or may not be present, instead of null
  val ages = Map("Ana" -> 30, "Bob" -> 25)
  def ageOf(name: String): Option[Int] = ages.get(name)

  println(ageOf("Ana").getOrElse(0)) // 30
  println(ageOf("Cris").getOrElse(0)) // 0

  // Try: a computation that might throw, captured as a value
  def parseInt(s: String): Try[Int] = Try(s.toInt)

  parseInt("42") match {
    case Success(n)  => println(s"parsed $n")
    case Failure(ex) => println(s"failed: ${ex.getMessage}")
  }
  parseInt("oops") match {
    case Success(n)  => println(s"parsed $n")
    case Failure(ex) => println(s"failed: ${ex.getMessage}")
  }

  // Either: Left for failure, Right for success — right-biased map/flatMap
  def divide(a: Int, b: Int): Either[String, Int] =
    if (b == 0) Left("division by zero") else Right(a / b)

  println(divide(10, 2))  // Right(5)
  println(divide(10, 0))  // Left(division by zero)

  // chaining several fallible steps with a for-comprehension
  val combined: Option[Int] = for {
    a <- ageOf("Ana")
    b <- ageOf("Bob")
  } yield a + b
  println(combined) // Some(55)
