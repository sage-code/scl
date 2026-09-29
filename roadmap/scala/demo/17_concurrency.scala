// 17 - Concurrency: Future, transformation, and error recovery
// Run: scala-cli run 17_concurrency.scala

import scala.concurrent.{Future, Await}
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.duration._
import scala.util.{Success, Failure}

@main def concurrency(): Unit =
  // Future { ... } schedules work asynchronously and returns immediately
  val slowSquare: Future[Int] = Future {
    Thread.sleep(100)
    21 * 2
  }
  println("started, not blocked")

  // futures compose with map/flatMap, exactly like Option and Try
  def fetchUser(id: Int): Future[String] = Future(s"user-$id")
  def fetchOrders(user: String): Future[Int] = Future(user.length * 3)

  val combined: Future[Int] = for {
    user   <- fetchUser(7)
    orders <- fetchOrders(user)
  } yield orders

  // a future can fail — recover supplies a fallback instead of crashing
  val risky: Future[Int] = Future(10 / 0)
  val safe = risky.recover { case _: ArithmeticException => -1 }

  // production code stays async end to end; here we block only so this
  // single-file demo has something to print before the program exits
  println(s"square = ${Await.result(slowSquare, 2.seconds)}")
  println(s"combined = ${Await.result(combined, 2.seconds)}")
  println(s"safe = ${Await.result(safe, 2.seconds)}")

  Await.ready(risky, 2.seconds).value.get match {
    case Success(v) => println(s"risky succeeded: $v")
    case Failure(e) => println(s"risky failed: ${e.getMessage}")
  }
