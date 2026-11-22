// 15_traits.rs — define shared behavior and implement it for your types.
// Run:  rustc 15_traits.rs && ./15_traits
fn main() {
    let dog = Dog { name: String::from("Rex") };
    let cat = Cat { name: String::from("Luna") };

    speak(&dog);
    speak(&cat);
}

trait Animal {
    fn speak(&self) -> String;
}

struct Dog { name: String }
impl Animal for Dog {
    fn speak(&self) -> String {
        format!("{} says woof", self.name)
    }
}

struct Cat { name: String }
impl Animal for Cat {
    fn speak(&self) -> String {
        format!("{} says meow", self.name)
    }
}

// &dyn Animal: dynamic dispatch through a trait object.
fn speak(animal: &dyn Animal) {
    println!("{}", animal.speak());
}
