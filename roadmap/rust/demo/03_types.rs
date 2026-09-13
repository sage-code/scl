// 03_types.rs — scalar types, inference, and casting.
// Run:  rustc 03_types.rs && ./03_types
fn main() {
    // Signed and unsigned integers of explicit width.
    let a: i32 = -42;        // signed 32-bit
    let b: u8 = 255;         // unsigned 8-bit
    let f: f64 = 3.14159;    // 64-bit float
    let flag: bool = true;
    let letter: char = 'λ';  // a Unicode scalar value (4 bytes)

    // Type inference: the suffix on the literal fixes the type.
    let n = 100usize;        // usize: pointer-sized, for indexing
    let m = 2.5f32;          // f32

    // Cast between numeric types with `as`.
    let ratio = m as f64 / n as f64;

    println!("{a} {b} {f} {flag} {letter} {n} {m:.2} {ratio:.4}");
}
