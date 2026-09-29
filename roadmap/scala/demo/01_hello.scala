// 01 - Hello, World
// Run: scala-cli run 01_hello.scala
//
// @main marks the entry point. Scala 3 does not require wrapping it in an
// object the way Scala 2 does — the compiler generates one for you.

@main def hello(): Unit =
  println("Hello, world!")
