// Operators: arithmetic, comparison, logical, assignment
int a = 10, b = 3;

Console.WriteLine($"a + b = {a + b}");
Console.WriteLine($"a - b = {a - b}");
Console.WriteLine($"a * b = {a * b}");
Console.WriteLine($"a / b = {a / b}");   // integer division -> 3
Console.WriteLine($"a % b = {a % b}");   // remainder -> 1

Console.WriteLine($"a > b: {a > b}");    // True
Console.WriteLine($"a == b: {a == b}");  // False

bool sunny = true, warm = false;
Console.WriteLine($"sunny && warm: {sunny && warm}"); // False
Console.WriteLine($"sunny || warm: {sunny || warm}"); // True

int score = 5;
score += 2;                 // score = 7
score++;                    // score = 8
Console.WriteLine($"score: {score}");
