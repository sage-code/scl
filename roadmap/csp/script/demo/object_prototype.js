// object constructor Shape:
function Shape() {
  this.name = 'Shape';
}
// object constructor Rectangle:
function Rectangle() {
/* Using JavaScript special function call(),
  an object can use a method belonging to another object */
  Shape.call(this);
}
// binding prototype, to realize the inheritance
Rectangle.prototype = Object.create(Shape.prototype);
// test inheritance
const rect = new Rectangle();
console.log(rect.name);
// expected output: "Shape"