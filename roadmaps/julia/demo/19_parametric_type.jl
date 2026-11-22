# Julia example 
const pi = 3.14

# create a parametric type
struct Point{T}
    x::T
    y::T
end
# create a point with integer coordinates
point1 = Point(1, 2)
println(point1)
# create a poit with real coordinates
point2 = Point{Float64}(1.0, 2.0)
println(point2)