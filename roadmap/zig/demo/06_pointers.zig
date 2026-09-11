// Pointers and slices — run: zig run 06_pointers.zig
const std = @import("std");

fn increment(p: *u32) void {
    p.* += 1; // .* dereferences: mutate what the caller passed
}

pub fn main() !void {
    var value: u32 = 41;
    increment(&value);
    std.debug.print("value = {d}\n", .{value});

    const arr = [_]u32{ 1, 2, 3, 4 };
    const slice: []const u32 = arr[1..3]; // fat pointer: ptr + len
    std.debug.print("slice len = {d}, first = {d}\n", .{ slice.len, slice[0] });
}
