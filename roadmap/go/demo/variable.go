//variables.go
package main

import "fmt"

var i, j int = 1, 2
var c = 0

func main() {
    var (
        c = true;
        p = false; 
        g = "no";
    )
	fmt.Println(i, j, c, p, g)
}