# demonstrate function states
def test_attr():
    if not hasattr(test_attr, "cnt"):
        test_attr.cnt = 0
    else:
        test_attr.cnt += 1
    return test_attr.cnt

# call function  attributes
for i in range(0,10):
    j=test_attr()
    print(i,'->',j)
