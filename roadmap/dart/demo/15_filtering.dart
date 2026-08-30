void main() {
  var list = [1, 2, 3, 4, 5];
  var evens = list.where((n) => n % 2 == 0);
  print(evens);
}