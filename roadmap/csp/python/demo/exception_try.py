def this_fails():
    x = 1/0

try:
     this_fails()
except ZeroDivisionError as err:
    print('run-time error:', err)