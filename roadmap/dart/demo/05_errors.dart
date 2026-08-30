void main() {
  try {
    throw Exception('Something went wrong!');
  } catch (e) {
    print('Caught error: $e');
  }
}