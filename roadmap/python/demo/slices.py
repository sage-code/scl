# List A = [1,2,3,4,5,6,7,8,9]
A = list(range(1,10,1))
print(A)
print(A[:])
B = A[2:5] # make a slice
print(B)
print(A[7:]) # from 8 to end
print(A[:2]) # from 1 to 2

# negative indexes
print(A[-2:])
print(A[2:-2])

