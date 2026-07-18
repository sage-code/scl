import java.util.*;

public abstract class Animal {
  public String kind;
  public String name;
  public Set<String> tricks;

  //constructor
  public Animal(String kind) {
    this.kind   = kind;
    this.tricks = new HashSet<String>();
  }

  public void addTrick(String trick) {
    this.tricks.add(trick);
  }
  //abstract method
  abstract String speak();
}
