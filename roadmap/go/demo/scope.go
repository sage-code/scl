// file scope.go
package main

import "fmt"

var i int = 1

func test() int {
	i += 1
	return i
}

func main() {
	fmt.Println(test())
	fmt.Println(test())
	fmt.Println(i)
}
