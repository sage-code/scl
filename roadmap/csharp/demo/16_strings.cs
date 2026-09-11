// Strings: interpolation, methods, StringBuilder
using System.Text;

string name = "Ada";
Console.WriteLine($"Hi {name}");                 // Hi Ada

string text = "  Hello World  ";
Console.WriteLine(text.Trim().ToUpper());        // HELLO WORLD
Console.WriteLine(text.Contains("World"));       // True
Console.WriteLine(text.Replace("World", "C#"));  // "  Hello C#  "

string data = "a,b,c";
string[] parts = data.Split(',');
Console.WriteLine(string.Join(" | ", parts));    // a | b | c

var sb = new StringBuilder();
for (int i = 0; i < 5; i++)
{
    sb.Append(i).Append(' ');
}
Console.WriteLine(sb.ToString());                // 0 1 2 3 4
