# example of a function that have a result type
function sum(x, y)::Float64
    return x + y
end

# two use cases
a = sum(1, 2)
b = sum(1.2, 2)

println(a)
println(b)
