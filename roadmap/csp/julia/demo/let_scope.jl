# define global
x = 0

# define local
let
    local x = 1
    let
        local x = 2
    end
    println(x) # local x
end
println(x) # global x