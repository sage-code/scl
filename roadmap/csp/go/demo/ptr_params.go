//ptr_params.go
package main
import "fmt"

func test(v *int) int {
  *v += 1
  return 0
}

func main() {
    var v int 
    
    fmt.Println("v = ", v) 
    _ = test(&v)
    _ = test(&v)    
    fmt.Println("v = ", v) 
}