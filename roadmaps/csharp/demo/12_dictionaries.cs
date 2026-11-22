// Dictionary<TKey,TValue>: fast key-value lookup
using System.Collections.Generic;

var scores = new Dictionary<string, int>
{
    ["Ada"] = 100,
    ["Linus"] = 90
};

scores["Grace"] = 95; // add or update

if (scores.TryGetValue("Ada", out int adaScore))
{
    Console.WriteLine($"Ada scored {adaScore}");
}

foreach (var pair in scores)
{
    Console.WriteLine($"{pair.Key}: {pair.Value}");
}
