// Struct: value type with copy semantics
struct Point
{
    public double X;
    public double Y;
}

Point a = new Point { X = 1, Y = 2 };
Point b = a;    // full copy
b.X = 99;       // a.X stays 1

Console.WriteLine($"a = ({a.X}, {a.Y})");
Console.WriteLine($"b = ({b.X}, {b.Y})");
