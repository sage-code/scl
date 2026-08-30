extension StringExtension on String {
  String capitalize() => this[0].toUpperCase() + substring(1);
}

void main() {
  print('dart'.capitalize());
}