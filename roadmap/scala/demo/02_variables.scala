// 02 - Variables: val vs var, and type inference
// Run: scala-cli run 02_variables.scala

@main def variables(): Unit =
  // val is immutable — assign once, never reassign
  val name = "Ada"
  println(s"name = $name")

  // var is mutable — can be reassigned
  var count = 0
  count += 1
  count += 1
  println(s"count = $count")

  // the compiler infers the type; you can also write it explicitly
  val pi: Double = 3.14159
  val isReady: Boolean = true

  println(s"pi = $pi, isReady = $isReady")

  // uncommenting the next line would not compile: val is single-assignment
  // name = "Grace"
