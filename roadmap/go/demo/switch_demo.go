//file switch_demo
package main

import (
  "fmt"
  "math/rand"
  "time"
)

func main() {
    rand.Seed(time.Now().UTC().UnixNano())
    v := rand.Intn(6)
    fmt.Println("Random v is: ", v)
	fmt.Print("Random v is ")
	switch v {
	case 0:
		fmt.Println(" = 0")
	case 1,2,3:
		fmt.Println(" < 4")
	default:
		fmt.Println(">= 4")
	}
}
