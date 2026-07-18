def bar(alfa = 0, beta = 0):
    if alfa !=0:
      return alfa
    else:
      return beta
pass

a = bar(alfa = 1)
b = bar(beta = 2)
c = bar(1, beta = 3)

print([a,b,c]) #[1,2,1]