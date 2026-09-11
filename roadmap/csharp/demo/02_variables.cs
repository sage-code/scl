// Variables and basic data types
int age = 30;                  // integer
double price = 19.99;          // double precision float
decimal balance = 1000.50m;    // decimal — exact, for money
bool enabled = true;           // boolean
char letter = 'A';             // single character
string name = "Ada";           // text

var count = 7;                 // inferred type: int
int? maybe = null;             // nullable int

Console.WriteLine($"{name} is {age}, balance {balance}, enabled {enabled}");
Console.WriteLine($"count={count}, letter={letter}, maybe={maybe ?? -1}");
