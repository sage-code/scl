/*spy demo*/
function test() 
{ let x = 5, y = 10;
  console.log(x,y) //first spy
  x++ 
  y++
  console.log(x,y) //second spy
  x++ 
  y++
  /* better ourput */
  console.log("x = ",x)
  console.log("y = ",y)
}