//file array_references.go
package main

import "fmt"

func main() {
	names := [4]string{
		"John",
		"Paul",
		"George",
		"Ringo",
	}
	fmt.Println(names)

	b := names[1:3]
	b[0] = "XXX"
	fmt.Println(b)    
	fmt.Println(names)
}