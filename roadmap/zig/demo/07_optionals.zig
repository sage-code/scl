// Optionals and orelse — run: zig run 07_optionals.zig
const std = @import("std");

fn findIndex(hay: []const u8, needle: u8) ?usize {
    for (hay, 0..) |byte, i| {
        if (byte == needle) return i;
    }
    return null; // absence is explicit in the return type
}

pub fn main() !void {
    const text = "sage-code";
    const found = findIndex(text, g) orelse 99;    // fallback when null
    const missing = findIndex(text, z) orelse 99;
    std.debug.print("{d} {d}\n", .{ found, missing });
}
