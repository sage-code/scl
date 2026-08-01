package main

import (
	"fmt"
	"math/rand"
)

func main() {
	grade := "X"
	score := 0
	for i := 0; i < 5; i++ {
		score = rand.Intn(100) + 1
		if score >= 90 {
			grade = "A"
		} else if score >= 80 {
			grade = "B"
		} else if score >= 70 {
			grade = "C"
		} else if score >= 60 {
			grade = "D"
		} else {
			grade = "F"
		}
		fmt.Print("grade =", grade)
		fmt.Println(" score =", score)
	}
}
