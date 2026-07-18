//prepare output variable
let output
function get_back(callback) {
   //execute callback function
   callback({value:"yes"});
}
//call a function with callback parameter
get_back((result) => {
   output = result;
})
//verify output value
console.log(output.value);