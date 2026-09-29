// 06 - Object-oriented programming: Java, the language that made the
// paradigm mainstream in enterprise software from the late 1990s onward.

class Counter {
    private int count = 0; // encapsulation: private field

    public void increment() {
        count = count + 1;
    }

    public int value() {
        return count;
    }
}

// Inheritance and polymorphism: ResettableCounter extends Counter and
// overrides one method.
class ResettableCounter extends Counter {
    @Override
    public void increment() {
        super.increment();
        if (value() > 5) {
            System.out.println("(auto-reset would go here)");
        }
    }
}

public class Main {
    public static void main(String[] args) {
        Counter c = new ResettableCounter(); // reference typed as the parent
        c.increment();
        c.increment();
        System.out.println("count = " + c.value()); // calls the overridden method
    }
}
