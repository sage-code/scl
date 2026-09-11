// Strings, formatting, parsing — run: zig run 10_strings.zig
const std = @import("std");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    // allocPrint builds a string on the heap — you chose the allocator
    const title = try std.fmt.allocPrint(allocator, "Page {d} of {d}", .{ 2, 10 });
    defer allocator.free(title);
    std.debug.print("{s}\n", .{title});

    // parsing returns an error union; bad input fails instead of corrupting
    const n = std.fmt.parseInt(u32, "2048", 10) catch 0;
    std.debug.print("{d}\n", .{n});
}
