# global scope
spam = "global spam"
test = "it works"
def do_local():
# local scope
    global spam
    spam = "spam is modified"
    print(test) # it works

do_local()
print(spam)
