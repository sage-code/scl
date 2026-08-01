//file type_ptr.go
package main

import "fmt"

func main() {
	i, j := 42, 2701

	p := &i         // point to i
	fmt.Println(*p) // read i through the pointer (42)
	*p = 21         // set i through the pointer
	fmt.Println(i)  // see the new value of i (21)

	p = &j          // point to j
	*p = *p / 37    // divide j through the pointer
	fmt.Println(j)  // see the new value of j (2701/37 = 73)
}