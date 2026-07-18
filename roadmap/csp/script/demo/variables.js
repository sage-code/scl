// using "=" operator
first = 0
// using var keyword
var second
// using let keyword
let third
// using const keyword
const forth="test"

//Multiple variables

let driver = "John", car = "Acura", year = "1999";

driver = "Xena",
car = "Porsche",
year = "2015";

//hoisting

a = 30;
console.log(a); //expect: 30
var a;
console.log(a); //expect: 30
var a=20;
console.log(a); //expect: 20

//data type
a = 30; // integer
type = typeof(a);
console.log(type); //'number'
a = 1.5; // float
type = typeof(a);
console.log(type); //'number'

//expressions

(6+12)/3
a =  (1+1)

a >= 2
b = a == 2

"this was" +"  "+"a test"