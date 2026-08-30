void main() async {
  var stream = Stream.fromIterable([1, 2, 3]);
  await for (var n in stream) {
    print(n);
  }
}