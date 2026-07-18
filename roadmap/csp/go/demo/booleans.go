package main
 
import (
    "fmt"
)
 
func main() {
    var a, b int = 5, 6
    var bVal bool   // default is false
    fmt.Printf("bVal: %v\n", bVal)
    fmt.Println(a == b)  // false
    fmt.Println(a < b)   // true
}
