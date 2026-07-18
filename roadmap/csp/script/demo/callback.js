// higher order function:
function bar(foo, a, b) {
  return foo(a,b);
};
// normal function
function sum(x, y) {
  return x+y;
}
// use normal function for callback
test = bar(sum, 4, 3)
console.log(test); // 7
// use function expression to create callback
test = bar( function(x,y) {return x+y},2,2)
console.log(test); // 4
// use arrow function to create callback
test = bar( (x,y) => {return x+y},4,4)
console.log(test); // 8
