t0 = (0,)
t1 = (1, 4, 3)

# finding elements
println(t0[1])   # 0
println(t1[end]) # 3
println(t1[2:3]) # (4, 3)

# unpacking
a, b, c = t1
print("a=$a, b=$b, c=$c")

#=============================# 
#  NOTES: Tuple are immutable # 
#=============================#