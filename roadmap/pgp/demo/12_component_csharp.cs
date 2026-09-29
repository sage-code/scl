// 12 - Component-oriented programming: C# was built from the start around
// components with a published interface — the .NET assembly and interface
// system — so unrelated teams could compose software without sharing
// source code, only the interface contract.

// The interface is the component's entire public contract.
public interface IGreeter
{
    string Greet(string name);
}

// One interchangeable implementation ("component") of that contract.
public class FormalGreeter : IGreeter
{
    public string Greet(string name) => $"Good day, {name}.";
}

// A second, unrelated implementation of the same contract — a consumer
// that only knows about IGreeter can swap one for the other with no
// code change, because it never depends on either class directly.
public class CasualGreeter : IGreeter
{
    public string Greet(string name) => $"Hey {name}!";
}

// A consumer composes components through their interfaces, never their
// concrete classes — this is what makes them truly interchangeable parts.
public class GreetingService
{
    private readonly IGreeter _greeter;

    public GreetingService(IGreeter greeter)
    {
        _greeter = greeter; // any IGreeter component can be plugged in here
    }

    public void Run(string name)
    {
        System.Console.WriteLine(_greeter.Greet(name));
    }
}

public class Program
{
    public static void Main()
    {
        var service = new GreetingService(new CasualGreeter());
        service.Run("Ana"); // swap in new FormalGreeter() and nothing else changes
    }
}
