// Errors as values — run: zig run 08_errors.zig
const std = @import("std");

fn divide(a: f64, b: f64) !f64 {
    if (b == 0.0) return error.DivisionByZero; // explicit failure value
    return a / b;
}

pub fn main() !void {
    // catch recovers locally with a fallback
    const safe = divide(10.0, 0.0) catch 0.0;
    std.debug.print("safe = {d}\n", .{safe});

    // try propagates to main, which prints the error and exits non-zero
    const real = try divide(10.0, 4.0);
    std.debug.print("real = {d}\n", .{real});
}
