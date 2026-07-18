package main

import (
	"fmt"
	"math"
)

// limited power
func main(x, n, lim float64) float64 {
	if v := math.Pow(x, n); v < lim {
		return v
	}
	return lim
}

func Local_scope() {
	fmt.Println(     
		pow_lim(3, 2, 20),
		pow_lim(7, 3, 20),
	)
}