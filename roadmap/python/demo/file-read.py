# open and list a file
f = open("demo\\flags.txt","rt")
try:
  content = f.read()
  print(type(content))
  print(content)
finally:
  f.close()

## reopen file and print lines
f = open("demo/flags.txt","rt")
for text_line in f:
  print(text_line,end="")

f.close()