// 04 - Strings: interpolation, formatting, and StringOps
// Run: scala-cli run 04_strings.scala

@main def strings(): Unit =
  val firstName = "Grace"
  val lastName  = "Hopper"

  // s-interpolation substitutes identifiers and expressions
  println(s"Name: $firstName $lastName")
  println(s"Initials: ${firstName.head}${lastName.head}")

  // f-interpolation adds printf-style format specifiers
  val rate = 3.14159
  println(f"Rate: $rate%.2f")

  // raw-interpolation does not process escape sequences
  println(raw"No newline here: \n")

  // common StringOps methods
  val messy = "  Scala, Kotlin, Java  "
  val parts = messy.trim.split(",").map(_.trim)
  println(parts.mkString(" | "))

  println("42".toIntOption)   // Some(42)
  println("nope".toIntOption) // None
