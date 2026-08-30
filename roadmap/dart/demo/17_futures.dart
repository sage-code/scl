Future<void> fetchData() async {
  await Future.delayed(Duration(seconds: 1));
  print('Data fetched');
}

void main() async {
  await fetchData();
}