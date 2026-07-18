# Example of composite type
mutable struct Person
    first_name 
    last_name
    age::Integer
 end
 
 # We create an instance of Person
 person = Person("John","Doe",25)
 print(person)