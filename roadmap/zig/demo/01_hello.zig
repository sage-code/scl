// Hello, World — run with: zig run 01_hello.zig
const std = @import("std");

pub fn main() !void {
    // {s} formats a slice, {d} formats an integer
    std.debug.print("Hello, {s}!", .{"World"});
    const year: u32 = 2026;
    std.debug.print(" The year is {d}.\n", .{year});
}
