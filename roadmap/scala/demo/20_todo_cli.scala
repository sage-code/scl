// 20 - Study project: an in-memory todo list
// Run: scala-cli run 20_todo_cli.scala
//
// Composes case classes, collections, pattern matching, and Option — a
// small end-to-end program instead of one isolated feature.

case class Todo(id: Int, text: String, done: Boolean = false)

class TodoList {
  private var items: List[Todo] = Nil
  private var nextId = 1

  def add(text: String): Todo = {
    val todo = Todo(nextId, text)
    items = items :+ todo
    nextId += 1
    todo
  }

  def complete(id: Int): Option[Todo] =
    items.find(_.id == id).map { found =>
      val updated = found.copy(done = true)
      items = items.map(t => if (t.id == id) updated else t)
      updated
    }

  def pending: List[Todo] = items.filterNot(_.done)
  def all: List[Todo] = items
}

@main def todoCli(): Unit =
  val list = new TodoList

  list.add("Learn Scala syntax")
  list.add("Write a case class")
  list.add("Understand Option and Try")

  list.complete(1) match {
    case Some(t) => println(s"completed: ${t.text}")
    case None    => println("not found")
  }

  println("\nAll items:")
  for (t <- list.all) {
    val mark = if (t.done) "[x]" else "[ ]"
    println(s"$mark #${t.id} ${t.text}")
  }

  println(s"\n${list.pending.length} item(s) still pending")
