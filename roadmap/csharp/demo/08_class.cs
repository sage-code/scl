// Class: reference type with reference semantics
class Person
{
    public string Name { get; set; } = "";
    public int Age { get; set; }
}

Person p1 = new Person { Name = "Ada", Age = 36 };
Person p2 = p1;   // same object
p2.Age = 40;

Console.WriteLine($"{p1.Name} is {p1.Age}"); // Ada is 40
Console.WriteLine(ReferenceEquals(p1, p2));   // True
