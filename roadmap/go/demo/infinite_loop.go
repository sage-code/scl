package main

import (
    "fmt"
    "time"
)

func main() {
  i := 0;
  for {
    fmt.Println("Press Ctrl+C to stop:")
    time.Sleep(3 * time.Second)
    if i > 10 { 
       fmt.Println("fail")
       break 
    }
    i += 1;
  }
}