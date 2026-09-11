// Variables, const, and types — run: zig run 02_variables.zig
const std = @import("std");

pub fn main() !void {
    const pi: f64 = 3.14159;   // immutable — the compiler may fold it away
    var counter: u32 = 0;      // mutable — needs var plus an assignment
    counter += 1;              // wrapped (+%) and saturating (+|) variants exist

    std.debug.print("pi = {d}, counter = {d}\n", .{ pi, counter });

    // Array literal with inferred length [_]
    const fib = [_]u32{ 1, 1, 2, 3, 5 };
    std.debug.print("fib[4] = {d}\n", .{fib[4]}); // bounds-checked in safe builds
}
