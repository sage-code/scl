// Arrays: fixed-size indexed storage
int[] nums = { 3, 1, 4, 1, 5 };
Console.WriteLine(nums.Length); // 5
Console.WriteLine(nums[0]);     // 3

nums[2] = 9;                    // assign by index
foreach (int v in nums)
{
    Console.Write($"{v} ");
}
Console.WriteLine();

// two-dimensional array
int[,] grid = { { 1, 2 }, { 3, 4 } };
Console.WriteLine(grid[1, 0]);  // 3
