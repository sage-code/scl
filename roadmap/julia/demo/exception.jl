# opening and closing a file
f = open("file.out","w")
try
    write(f, "hello world")
finally
    close(f)
end