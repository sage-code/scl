// file mutex_ob.go
package main

import (
	"fmt"
	"sync"
	"time"
)

// safe to use concurrently.
type SafeCounter struct {
	v   map[string]int
	mux sync.Mutex
}

// increments the counter 
func (c *SafeCounter) Inc(key string) {
	// get exclusive access	
	c.mux.Lock()
	c.v[key]++
	c.mux.Unlock()
}

// returns the current value 
func (c *SafeCounter) Value(key string) int {
	c.mux.Lock()
	// Lock so only one goroutine at a time can access the map c.v.
	defer c.mux.Unlock()
	return c.v[key]
}

func main() {
	c := SafeCounter{v: make(map[string]int)}
	for i := 0; i < 1000; i++ {
		go c.Inc("somekey")
	}

	time.Sleep(time.Second)
	fmt.Println(c.Value("somekey"))
}
