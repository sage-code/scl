import os

examples = {
    "01_hello.dart": "void main() {\n  print('Hello, World!');\n  // Basic output to console\n}",
    "02_types.dart": "void main() {\n  int age = 25;\n  double height = 1.75;\n  String name = 'Dart';\n  bool isFun = true;\n  print('$name is $age years old.');\n}",
    "03_control_flow.dart": "void main() {\n  int number = 10;\n  if (number > 5) {\n    print('Greater than 5');\n  } else {\n    print('Less than or equal to 5');\n  }\n}",
    "04_functions.dart": "int add(int a, int b) => a + b;\n\nvoid main() {\n  print(add(5, 3));\n}",
    "05_errors.dart": "void main() {\n  try {\n    throw Exception('Something went wrong!');\n  } catch (e) {\n    print('Caught error: $e');\n  }\n}",
    "06_classes.dart": "class Person {\n  String name;\n  Person(this.name);\n}\n\nvoid main() {\n  var p = Person('Alice');\n  print(p.name);\n}",
    "07_constructors.dart": "class Point {\n  int x, y;\n  Point(this.x, this.y);\n  Point.origin() : x = 0, y = 0;\n}\n\nvoid main() {\n  var p = Point.origin();\n  print('${p.x}, ${p.y}');\n}",
    "08_inheritance.dart": "class Animal { void eat() => print('Eating'); }\nclass Dog extends Animal { void bark() => print('Barking'); }\n\nvoid main() {\n  var d = Dog();\n  d.eat();\n  d.bark();\n}",
    "09_mixins.dart": "mixin Walker { void walk() => print('Walking'); }\nclass Person with Walker {}\n\nvoid main() {\n  var p = Person();\n  p.walk();\n}",
    "10_enums.dart": "enum Status { pending, running, finished }\n\nvoid main() {\n  var s = Status.running;\n  print(s);\n}",
    "11_lists.dart": "void main() {\n  var list = [1, 2, 3];\n  list.add(4);\n  print(list);\n}",
    "12_sets.dart": "void main() {\n  var set = {1, 2, 3, 3};\n  print(set);\n}",
    "13_maps.dart": "void main() {\n  var map = {'key': 'value'};\n  print(map['key']);\n}",
    "14_iterables.dart": "void main() {\n  var list = [1, 2, 3];\n  list.forEach((n) => print(n));\n}",
    "15_filtering.dart": "void main() {\n  var list = [1, 2, 3, 4, 5];\n  var evens = list.where((n) => n % 2 == 0);\n  print(evens);\n}",
    "16_null_safety.dart": "void main() {\n  String? name = null;\n  print(name ?? 'Unknown');\n}",
    "17_futures.dart": "Future<void> fetchData() async {\n  await Future.delayed(Duration(seconds: 1));\n  print('Data fetched');\n}\n\nvoid main() async {\n  await fetchData();\n}",
    "18_streams.dart": "void main() async {\n  var stream = Stream.fromIterable([1, 2, 3]);\n  await for (var n in stream) {\n    print(n);\n  }\n}",
    "19_extensions.dart": "extension StringExtension on String {\n  String capitalize() => this[0].toUpperCase() + substring(1);\n}\n\nvoid main() {\n  print('dart'.capitalize());\n}",
    "20_generics.dart": "class Box<T> {\n  T value;\n  Box(this.value);\n}\n\nvoid main() {\n  var box = Box<int>(10);\n  print(box.value);\n}"
}

for filename, content in examples.items():\n    with open(f'roadmap/dart/demo/{filename}', 'w') as f:\n        f.write(content)"
,path: