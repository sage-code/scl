// 18_structs.rs — structs, impl blocks, and methods.
// Run:  rustc 18_structs.rs && ./18_structs
fn main() {
    let mut rect = Rectangle {
        width: 30,
        height: 50,
    };

    println!("area = {}", rect.area());
    rect.double_size();
    println!("new area = {}", rect.area());
    println!("rect is {rect:?}");
}

#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn area(&self) -> u32 {
        self.width * self.height
    }

    fn double_size(&mut self) {
        self.width *= 2;
        self.height *= 2;
    }
}
