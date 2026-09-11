// Record: reference type with value equality
record Point(double X, double Y);

Point a = new Point(1, 2);
Point b = new Point(1, 2);
Console.WriteLine(a == b);          // True — value equality

Point moved = a with { X = 5 };     // non-destructive copy
Console.WriteLine(moved);           // Point { X = 5, Y = 2 }
