class Rabbit extends Animal {
  hide() {
    alert(`${this.name} hides!`);
  }

  stop() {
    super.stop();
    this.hide();
  }
}

class Frog extends Animal {
  dive() {
    alert(`${this.name} dive!`);
  }

  stop() {
    super.stop();
    this.dive();
  }
}