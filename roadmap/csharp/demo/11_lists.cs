// List<T>: resizable generic list
using System.Collections.Generic;

var names = new List<string> { "Ada", "Linus" };
names.Add("Grace");
names.Insert(0, "Alan");

Console.WriteLine(names.Count); // 4
Console.WriteLine(names[0]);    // Alan

if (names.Contains("Grace"))
{
    Console.WriteLine("Grace found");
}

Console.WriteLine(string.Join(", ", names));
