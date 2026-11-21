# Multiple dispatch and vectorized broadcasting in Julia.

abstract type Shape end
struct Circle <: Shape
    r::Float64
end
struct Rect <: Shape
    w::Float64
    h::Float64
end

# Method specialization is chosen dynamically on all argument types
area(s::Circle) = pi * s.r^2
area(s::Rect)   = s.w * s.h

shapes = Shape[Circle(2.0), Rect(3.0, 4.0), Circle(1.5)]

# Dot syntax broadcasts `area` across the array without an explicit loop
areas = area.(shapes)
println("Areas: ", round.(areas, digits=3))
println("Total: ", round(sum(areas), digits=3))
