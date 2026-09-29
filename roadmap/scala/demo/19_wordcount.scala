// 19 - Study project: word frequency counter
// Run: scala-cli run 19_wordcount.scala
//
// Composes several earlier lessons: strings (splitting, normalizing),
// collections (grouping, sorting), and functions (a small pipeline).

@main def wordcount(): Unit =
  val text =
    """Scala is a multi-paradigm language. Scala runs on the JVM.
      |Scala mixes functional and object-oriented programming. Learn Scala well.""".stripMargin

  val words = text
    .toLowerCase
    .split("""[^a-z]+""")   // split on anything that is not a lowercase letter
    .filter(_.nonEmpty)

  val counts: Map[String, Int] =
    words.groupBy(identity).view.mapValues(_.length).toMap

  val ranked = counts.toList.sortBy { case (word, count) => (-count, word) }

  println(f"WORD${" " * 8}COUNT")
  for ((word, count) <- ranked.take(10))
    println(f"$word%-12s $count")

  println(s"\ntotal words: ${words.length}, unique words: ${counts.size}")
