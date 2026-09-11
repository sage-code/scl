// Exceptions: try/catch/finally and custom errors
try
{
    int divisor = int.Parse("0");
    int result = 10 / divisor;
    Console.WriteLine(result);
}
catch (DivideByZeroException)
{
    Console.WriteLine("Cannot divide by zero.");
}
catch (Exception ex)
{
    Console.WriteLine($"Error: {ex.Message}");
}
finally
{
    Console.WriteLine("cleanup always runs");
}

// custom exception type
class ValidationException : Exception
{
    public ValidationException(string message) : base(message) { }
}

static void Register(string name)
{
    if (string.IsNullOrWhiteSpace(name))
        throw new ValidationException("Name is required.");
}
