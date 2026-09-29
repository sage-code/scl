// 08 - List, Map, Set, Vector, and the map/filter/fold pipeline
// Run: scala-cli run 08_collections.scala

@main def collections(): Unit =
  // List: ordered, immutable, singly linked
  val numbers = List(1, 2, 3, 4, 5)
  println(numbers)

  // functional pipeline: transform, keep, combine
  val result = numbers
    .map(_ * 2)        // List(2, 4, 6, 8, 10)
    .filter(_ > 4)      // List(6, 8, 10)
    .foldLeft(0)(_ + _)  // 24
  println(s"pipeline result = $result")

  // Vector: like List but efficient random access, good default for larger data
  val vec = Vector(10, 20, 30)
  println(vec(1)) // 20

  // Map: key-value pairs
  val ages = Map("Ada" -> 36, "Grace" -> 85)
  println(ages.get("Ada"))     // Some(36)
  println(ages.getOrElse("Bob", -1)) // -1

  // Set: unique elements, no order guarantee
  val uniques = Set(1, 2, 2, 3, 3, 3)
  println(uniques) // Set(1, 2, 3)

  // ArrayBuffer: the mutable, growable sequence when you truly need mutation
  import scala.collection.mutable.ArrayBuffer
  val buffer = ArrayBuffer(1, 2, 3)
  buffer += 4
  println(buffer)
