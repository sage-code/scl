import json

# some JSON:
x = """
    { "name":"John",
      "age":30,
      "city":"New York"}
    """
# parse x:
y = json.loads(x)


# the result is a Python dictionary:
assert y.age == 30

print(y["age"]) # 30
