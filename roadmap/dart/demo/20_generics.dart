class Box<T> {
  T value;
  Box(this.value);
}

void main() {
  var box = Box<int>(10);
  print(box.value);
}