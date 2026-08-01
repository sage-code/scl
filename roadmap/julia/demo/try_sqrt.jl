# imaginary sqrt
function imqr(x)
    try
        sqrt(x) + 0im
    catch e
        sqrt(-x)im
    end
end
# imaginary sqrt call
println(imqr(1))
println(imqr(-1))