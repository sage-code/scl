// Control flow: if/else, switch, switch expression
int score = 75;

if (score >= 60)
{
    Console.WriteLine("Pass");
}
else
{
    Console.WriteLine("Fail");
}

string grade = "B";
switch (grade)
{
    case "A": Console.WriteLine("Excellent"); break;
    case "B": Console.WriteLine("Good");      break;
    default:  Console.WriteLine("Keep going"); break;
}

// Switch expression — concise form
string result = grade switch
{
    "A" => "Excellent",
    "B" => "Good",
    _   => "Keep going"
};
Console.WriteLine(result);
