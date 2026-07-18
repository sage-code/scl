//file conditional_branch.go
package main

import (
	"fmt"
	"math"
)

func sqrt(x float64) string {
	if x &lt; 0 {
		return sqrt(-x) + "i"
	}
	return fmt.Sprint(math.Sqrt(x))
}

func main() {
	fmt.Println(sqrt(2), sqrt(-4))
}