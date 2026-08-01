// file goroutine.go
package main

import (
	"fmt"
	"time"
)

func say(s string) {
	for i := 0; i <= 5; i++ {
		time.Sleep(1000 * time.Millisecond)
		fmt.Println(s, i)
	}
}

func main() {
	go say("sleep")
    fmt.Println("doing....")
	time.Sleep(8000 * time.Millisecond)
	fmt.Println("done")
}
