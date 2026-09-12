# =================================#
# Dictionaries store mappings      #
# key => value pairs               #
# key is indexed and unique        #
# =================================#
d = Dict() 

# append elements
d['a']=1; d['b']=4; d['c']=8
println("d = ",d)

# Create a dictionary using a literal
numbers = Dict( "one"   => 1, 
                "two"   => 2, 
                "three" => 3)
println("numbers = ", numbers)

# Access elements
println("first =", numbers["one"])
println("last  =", numbers["three"])