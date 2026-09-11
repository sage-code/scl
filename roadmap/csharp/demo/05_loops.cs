// Loops: for, foreach, while, do/while
for (int i = 0; i < 5; i++)
{
    Console.Write($"{i} ");
}
Console.WriteLine();

string[] names = { "Ada", "Linus", "Grace" };
foreach (string name in names)
{
    Console.Write($"{name} ");
}
Console.WriteLine();

int j = 0;
while (j < 3)
{
    Console.Write($"{j} ");
    j++;
}
Console.WriteLine();

int k = 0;
do
{
    Console.Write($"{k} ");
    k++;
} while (k < 3);
Console.WriteLine();
