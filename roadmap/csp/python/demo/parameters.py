def foo(a, b, c = 0, d = 0):
  return a+b+c+d

x = foo(1,2)
y = foo(1,2,3)
z = foo(1,2,3,4)

print([x,y,z])