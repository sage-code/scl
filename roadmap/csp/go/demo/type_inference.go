//file type_inference.go
package main

import "fmt"
import "reflect"

func main() {
	var i, j int = 1, 2
	k := 3
	c, p, g := true, false, "no!"

	fmt.Println(i, j, k, c, p, g)
    
    fmt.Println("typeof(c)=",reflect.TypeOf(c))
    fmt.Println("typeof(g)=",reflect.TypeOf(g))    
}