// File I/O with an allocator — run: zig run 12_files.zig
const std = @import("std");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const file = try std.fs.cwd().createFile("zig-demo.txt", .{});
    defer file.close();
    try file.writeAll("written by Zig\n");

    const contents = try std.fs.cwd().readFileAlloc(allocator, "zig-demo.txt", 1024);
    defer allocator.free(contents);
    std.debug.print("read back: {s}", .{contents});
}
