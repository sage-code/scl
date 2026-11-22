// comptime generics — run: zig run 05_comptime.zig
const std = @import("std");

// T is a type known at compile time; one machine-optimized version per T call
fn max(comptime T: type, a: T, b: T) T {
    return if (a > b) a else b;
}

pub fn main() !void {
    const a = max(u32, 10, 20);   // instantiates the u32 version
    const b = max(f64, 1.5, 2.5); // and a separate f64 version
    std.debug.print("{d} {d}\n", .{ a, b });
}
