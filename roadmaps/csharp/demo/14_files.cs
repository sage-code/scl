// File I/O: read and write text files
using System.IO;

File.WriteAllText("notes.txt", "first line");
File.AppendAllText("notes.txt", "\nsecond line");

string text = File.ReadAllText("notes.txt");
Console.WriteLine(text);

string[] lines = File.ReadAllLines("notes.txt");
Console.WriteLine($"lines: {lines.Length}");
