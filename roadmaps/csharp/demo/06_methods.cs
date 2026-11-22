// Methods: overloads, ref, out
static int Add(int a, int b) => a + b;
static double Add(double a, double b) => a + b; // overload

static void Triple(ref int value) => value *= 3;

static void Split(string name, out string first, out string last)
{
    string[] parts = name.Split(' ');
    first = parts[0];
    last = parts[1];
}

Console.WriteLine(Add(2, 3));     // 5
Console.WriteLine(Add(2.5, 3.5)); // 6

int n = 5;
Triple(ref n);
Console.WriteLine(n); // 15

Split("Ada Lovelace", out string f, out string l);
Console.WriteLine($"{f} | {l}"); // Ada | Lovelace
