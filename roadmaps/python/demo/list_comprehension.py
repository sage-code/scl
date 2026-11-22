# list comprehension 
seq1 = 'ab'
seq2 = (1,2)
# build a list of tuples
lst = [ (x,y) for x in seq1 for y in seq2]
print(lst)

