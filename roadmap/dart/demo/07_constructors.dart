class Point {
  int x, y;
  Point(this.x, this.y);
  Point.origin() : x = 0, y = 0;
}

void main() {
  var p = Point.origin();
  print('${p.x}, ${p.y}');
}