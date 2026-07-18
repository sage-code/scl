//file interface.go
package main

import (
	"fmt"
	"math"
)

//define an interface
type Abser interface {
	Abs() float64
}

func main() {
    // variable a require interface
	var a Abser

	//define a function f
	f := MyFloat(-math.Sqrt2)
    
    // correct: positive test
	a = f  // f is a MyFloat implements Abser

	v := Vertex{3, 4}    
    
    // correct: positive test
	a = &v // a *Vertex implements Abs() so it satisfy interface
    
    // Negative test
	// In the following line, v is a Vertex (not *Vertex)
	// therefore does NOT implement Abser
    // You can uncoment this line to demo error
	// a = v

	fmt.Println(a.Abs())
}

//this is a custom type that implement interface Abser
type MyFloat float64

func (f MyFloat) Abs() float64 {
	if f < 0 {
		return float64(-f)
	}
	return float64(f)
}

//define class Vertex
type Vertex struct {
	X, Y float64
}

//method of Vertex 
func (v *Vertex) Abs() float64 {
	return math.Sqrt(v.X*v.X + v.Y*v.Y)
}