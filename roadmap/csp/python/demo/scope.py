# demonstrate function scope
spam = "global spam"

# local scope
def do_local():
    spam = "local spam"
    print(spam)

do_local()
print(spam)