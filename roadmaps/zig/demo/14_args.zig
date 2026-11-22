// Command-line arguments — run: zig run 14_args.zig -- a b c
const std = @import("std");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const args = try std.process.argsAlloc(allocator);
    defer std.process.argsFree(allocator, args);
    std.debug.print("{d} argument(s):\n", .{args.len - 1});
    for (args[1..], 0..) |arg, i| {
        std.debug.print("  {d}: {s}\n", .{ i + 1, arg });
    }
}
