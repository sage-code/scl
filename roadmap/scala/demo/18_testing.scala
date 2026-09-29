// 18 - Testing with MUnit
// Run: scala-cli test 18_testing.scala
// (note the `test` subcommand, not `run` — scala-cli fetches MUnit from the
// `using dep` directive below the first time you run this)

//> using dep "org.scalameta::munit::1.0.0"

def add(a: Int, b: Int): Int = a + b
def divide(a: Int, b: Int): Int = a / b

class MathUtilsSuite extends munit.FunSuite {

  test("add sums two positive numbers") {
    assertEquals(add(2, 3), 5)
  }

  test("add handles negative numbers") {
    assertEquals(add(2, -3), -1)
  }

  test("divide by zero throws") {
    intercept[ArithmeticException] {
      divide(10, 0)
    }
  }
}
