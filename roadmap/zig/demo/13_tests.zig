// Unit tests with leak detection — run: zig test 13_tests.zig
const std = @import("std");

fn add(a: u32, b: u32) u32 {
    return a + b;
}

test "add works" {
    try std.testing.expectEqual(@as(u32, 5), add(2, 3));
}

test "no leaks allowed" {
    const buf = try std.testing.allocator.alloc(u8, 8);
    defer std.testing.allocator.free(buf); // omit -> test fails with a leak
    buf[0] = 42;
    try std.testing.expect(buf[0] == 42);
}
