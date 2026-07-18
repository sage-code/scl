//file array_init.go
package main

import "fmt"

func main() {
    // declare an arry with two elements
	var a [2]string
    
	a[0] = "Hello" // first element
	a[1] = "World" // second element

	fmt.Println(a[0], a[1])
	fmt.Println(a)

    // declare arry with initializers
	primes := [6]int{2, 3, 5, 7, 11, 13}
	fmt.Println(primes) 
}