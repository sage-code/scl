// Control flow as expressions — run: zig run 03_control.zig
const std = @import("std");

pub fn main() !void {
    // if builds a value; both branches are mandatory in expression form
    const score: u8 = 75;
    const label = if (score >= 60) "pass" else "retry";
    std.debug.print("{s}\n", .{label});

    // switch is exhaustive: else covers any other u8 value
    const digits = [_]u8{ 1, 2, 3, 4 };
    var total: u32 = 0;
    for (digits) |d| {
        total += switch (d % 2) {
            0 => 10,
            else => 1,
        };
    }
    std.debug.print("total = {d}\n", .{total});
}
