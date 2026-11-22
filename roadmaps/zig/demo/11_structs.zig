// Structs, enums, tagged unions — run: zig run 11_structs.zig
const std = @import("std");

const Point = struct {
    x: f64,
    y: f64,
};

const Color = enum { red, green, blue };

const Value = union(enum) {
    int: i64,
    text: []const u8,
};

pub fn main() !void {
    const p = Point{ .x = 3.0, .y = 4.0 };
    std.debug.print("point ({d}, {d})\n", .{ p.x, p.y });

    const favorite: Color = .green;
    const tag: u8 = @intFromEnum(favorite);
    std.debug.print("green tag = {d}\n", .{tag});

    const v = Value{ .text = "sage" };
    switch (v) {
        .int => |n| std.debug.print("int {d}\n", .{n}),
        .text => |s| std.debug.print("text {s}\n", .{s}), // hits here
    }
}
