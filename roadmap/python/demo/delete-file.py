import os

if os.path.exists("demo/test.txt"):
  os.remove("demo/test.txt")
  print("file test.txt was deleted")
else:
  print("The file does not exist")