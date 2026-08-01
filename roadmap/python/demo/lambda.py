import math

# demo lambda function
def sqroot(x):
    """
    Finds the square root of the number passed in
    """
    return math.sqrt(x)

square_rt = lambda x: math.sqrt(x)

assert sqroot(49) == 7.0
assert square_rt(64) == 8.0

print("done.")