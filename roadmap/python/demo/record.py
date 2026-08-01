# a simple class
class record: pass

# define attributes
record.type    = "url"
record.domain  = "https://sagecode.org"
record.purpose = "Research Laboratory"

# print attributes
print(record.domain)

# instantiation
test = record();
print(test.domain);
