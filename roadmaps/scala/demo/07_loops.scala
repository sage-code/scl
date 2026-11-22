// 07 - for, while, and labeled breaks
// Run: scala-cli run 07_loops.scala

import scala.util.control.Breaks._

@main def loops(): Unit =
  println("simple for loop over a range")
  for (i <- 1 to 3) println(s"i = $i")

  println("for loop with a filter guard")
  for (i <- 1 to 10 if i % 3 == 0) println(s"multiple of 3: $i")

  println("while loop")
  var count = 0
  while (count < 3) {
    println(s"count = $count")
    count += 1
  }

  println("loop with break")
  breakable {
    for (i <- 1 to 10) {
      println(s"i = $i")
      if (i > 4) break()
    }
  }

  println("nested loops with two independent labels")
  val outer = new Breaks
  val inner = new Breaks
  outer.breakable {
    for (i <- 1 to 3) {
      inner.breakable {
        for (j <- 'a' to 'e') {
          if (i == 1 && j == 'c') inner.break() // skip to next i
          else println(s"i=$i j=$j")
          if (i == 2 && j == 'b') outer.break()  // stop everything
        }
      }
    }
  }
