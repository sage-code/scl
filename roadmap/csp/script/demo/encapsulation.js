class Name {
  // class methods
  constructor(p1, p2) {
    this.property1 = p1;
this.property2 = p2;
  }

  // setter and getters
  get property1() {
    return this._p1
  }
  set property1(p) {
    this._p1 = p;
  }

  ...

  other_method() {
     ...
  }
}
