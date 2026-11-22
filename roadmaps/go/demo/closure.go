//file closure.go
package main

import "fmt"

func adder(start int) func(int) int {
    sum := start
    return func(x int) int {
        sum += x
        return sum
    }
}

func main() {
    foo := adder(0)
    bar := adder(10)
    for i := 0; i < 5; i++ {
        fmt.Println(
            foo(i),
            bar(i),
        )
    }
}