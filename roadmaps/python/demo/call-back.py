def test(bar, a, b):
  return bar(a, b)

r1 = test(lambda x,y: x + y, 2,3)
r2 = test(lambda x,y: x * y, 2,3)

print("r1:",r1)
print("r2:",r2)
