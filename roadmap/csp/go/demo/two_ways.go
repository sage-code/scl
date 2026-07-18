//file two_ways.go
package main

import (
    "fmt"
    "math"
)

func pow(x, n, lim float64) float64 {
    // Two ways decision with local variable "v"
    if v := math.Pow(x, n); v < lim {
        return v
    } else {
        fmt.Printf("%g >= %g\n", v, lim)
    }
    // can't use v here, it's gone
    return lim
}

func main() {
    fmt.Println(
        pow(3, 2, 10),
        pow(3, 3, 20),
    )
}