// 05 - Named functions, anonymous functions, and higher-order functions
// Run: scala-cli run 05_functions.scala

@main def functions(): Unit =
  // a named function
  def square(x: Int): Int = x * x
  println(square(6)) // 36

  // an anonymous function (lambda) assigned to a val
  val cube = (x: Int) => x * x * x
  println(cube(3)) // 27

  // a higher-order function: takes a function as a parameter
  def applyTwice(f: Int => Int, x: Int): Int = f(f(x))
  println(applyTwice(square, 3)) // square(square(3)) = 81

  // functions that return functions (currying)
  def multiplier(factor: Int): Int => Int =
    x => x * factor

  val triple = multiplier(3)
  println(triple(7)) // 21

  // a pure function: same input always produces the same output, no side effects
  def add(a: Int, b: Int): Int = a + b
  println(add(2, 2)) // always 4
