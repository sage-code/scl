// Allocators: GPA + arena — run: zig run 09_allocator.zig
const std = @import("std");

pub fn main() !void {
    // GPA detects leaks at deinit; defer _ = gpa.deinit() checks the result
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const buf = try allocator.alloc(u32, 4);
    defer allocator.free(buf); // free or the GPA reports a leak
    buf[0] = 7;

    // Arena: free everything at once — no individual frees needed
    var arena = std.heap.ArenaAllocator.init(std.heap.page_allocator);
    defer arena.deinit();
    const a = arena.allocator();
    const a1 = try a.alloc(u8, 64);
    const a2 = try a.alloc(u8, 64);
    std.debug.print("buf[0]={d}, arena {d}+{d} bytes\n", .{ buf[0], a1.len, a2.len });
}
