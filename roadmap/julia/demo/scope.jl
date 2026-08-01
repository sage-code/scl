# declare 3 global variables
x = y = 0
#in test function a and x are local
function test()
    local x = 1
    println("x = $x")
    global y = 1    
end
test() 
println("x = $x")
println("y = $y")
