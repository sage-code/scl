## reopen file and print lines
f = open("demo/test.txt","w")
f.write("New content!\n")
f.close()

f = open("demo/test.txt", "a")
f.write("More content!\n")
f.close()

#open and read the file
f = open("demo/test.txt", "r")
print(f.read())
