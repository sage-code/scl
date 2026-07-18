//file map_mutation.go
package main

import "fmt"

func main() {
    // declare a map m using type inference operator ":="   
    m := make(map[string]int)

    // create a new element in the map
    m["Answer"] = 42
    fmt.Println("The value:", m["Answer"])

    // create a new element in the map
    m["Answer"] = 48
    fmt.Println("The value:", m["Answer"])

    // remove element from the map
    delete(m, "Answer")
    fmt.Println("The value:", m["Answer"])

    // search for map element by name
    v, ok := m["Answer"]
    fmt.Println("v = ", v)    
    
    // expected: false
    fmt.Println("The Answer is present?", ok)
}