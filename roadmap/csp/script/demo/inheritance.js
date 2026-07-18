class Rabbit extends Animal {

  constructor(name, earLength) {
    super(name);
    this.earLength = earLength;
    this.color = "gray"
  }

  // ...
}

class Frog extends Animal {

  constructor(name) {
    super(name);
    this.color = "green";
  }

  // ...
}
