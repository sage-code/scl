# dictionary_builder
fields = ['a', 'b', 'c']
values = [1, 2, 3]
record = {key:value for key,value in zip(fields, values)}
print(record)
