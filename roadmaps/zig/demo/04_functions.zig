// Functions and defer — run: zig run 04_functions.zig
const std = @import("std");

fn add(a: u32, b: u32) u32 {
    return a + b; // parameters behave like const values
}

pub fn main() !void {
    defer std.debug.print("cleanup: scope exiting\n", .{});
    const allocator = std.heap.page_allocator;
    const buf = try allocator.alloc(u8, 4);
    defer allocator.free(buf); // runs at scope exit, even on early returns
    std.debug.print("sum = {d}\n", .{add(20, 22)});
}
